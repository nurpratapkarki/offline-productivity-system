use axum::{
    extract::{Path, State},
    http::Extensions,
    response::Json,
    routing::{delete, get, post},
    Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    error::{AppError, Result},
    models::{Note, Task, Habit},
    services::GoogleDriveService,
    AppState,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBackupRequest {
    pub access_token: String,
    pub encryption_key: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RestoreBackupRequest {
    pub access_token: String,
    pub file_id: String,
    pub encryption_key: Option<String>,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", post(create_backup))
        .route("/list", post(list_backups))
        .route("/restore", post(restore_backup))
        .route("/:file_id", delete(delete_backup))
}

pub async fn create_backup(
    State(state): State<AppState>,
    extensions: Extensions,
    Json(payload): Json<CreateBackupRequest>,
) -> Result<Json<serde_json::Value>> {
    let user_id = extensions.get::<Uuid>()
        .copied()
        .ok_or_else(|| AppError::Auth("User ID not found in request".to_string()))?;

    tracing::info!("Creating backup for user: {}", user_id);
    let drive_service = GoogleDriveService::new();

    // Get all user data
    let notes = sqlx::query_as!(
        Note,
        "SELECT * FROM notes WHERE user_id = $1 AND deleted_at IS NULL",
        user_id
    )
    .fetch_all(state.database.pool())
    .await?;

    let tasks = sqlx::query!(
        "SELECT id, user_id, title, description, created_at, updated_at, version, deleted_at FROM tasks WHERE user_id = $1 AND deleted_at IS NULL",
        user_id
    )
    .fetch_all(state.database.pool())
    .await?;

    let habits = sqlx::query_as!(
        Habit,
        "SELECT * FROM habits WHERE user_id = $1 AND deleted_at IS NULL",
        user_id
    )
    .fetch_all(state.database.pool())
    .await?;

    // Create backup data
    // Convert query results to serializable format
    let notes_data: Vec<serde_json::Value> = notes.into_iter().map(|note| {
        serde_json::json!({
            "id": note.id,
            "user_id": note.user_id,
            "title": note.title,
            "content": note.content,
            "tags": note.tags,
            "is_encrypted": note.is_encrypted,
            "created_at": note.created_at,
            "updated_at": note.updated_at,
            "version": note.version
        })
    }).collect();

    let tasks_data: Vec<serde_json::Value> = tasks.into_iter().map(|task| {
        serde_json::json!({
            "id": task.id,
            "user_id": task.user_id,
            "title": task.title,
            "description": task.description,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "version": task.version
        })
    }).collect();

    let habits_data: Vec<serde_json::Value> = habits.into_iter().map(|habit| {
        serde_json::json!({
            "id": habit.id,
            "user_id": habit.user_id,
            "name": habit.name,
            "color": habit.color,
            "streak": habit.streak,
            "completed_dates": habit.completed_dates,
            "created_at": habit.created_at,
            "updated_at": habit.updated_at,
            "version": habit.version
        })
    }).collect();

    let backup_data = serde_json::json!({
        "user_id": user_id,
        "created_at": Utc::now(),
        "version": "1.0",
        "notes": notes_data,
        "tasks": tasks_data,
        "habits": habits_data
    });

    let backup_json = serde_json::to_string_pretty(&backup_data)?;
    
    // Encrypt if key provided
    let final_data = if let Some(key) = payload.encryption_key {
        drive_service.encrypt_backup_data(&backup_json, &key)?
    } else {
        backup_json
    };

    // Upload to Google Drive (single backup file)
    let backup_name = GoogleDriveService::create_backup_name(user_id);

    tracing::info!("Uploading backup to Google Drive: {}", backup_name);
    let file_id = drive_service
        .upload_backup(&payload.access_token, user_id, &final_data, &backup_name)
        .await
        .map_err(|e| {
            tracing::error!("Google Drive upload failed: {:?}", e);
            e
        })?;

    tracing::info!("Backup uploaded successfully with file_id: {}", file_id);

    Ok(Json(serde_json::json!({
        "success": true,
        "file_id": file_id,
        "backup_name": backup_name
    })))
}

pub async fn list_backups(
    State(_state): State<AppState>,
    extensions: Extensions,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>> {
    let user_id = extensions.get::<Uuid>()
        .copied()
        .ok_or_else(|| AppError::Auth("User ID not found in request".to_string()))?;
    let access_token = payload["access_token"]
        .as_str()
        .ok_or_else(|| AppError::Validation("access_token is required".to_string()))?;

    let drive_service = GoogleDriveService::new();
    let backups = drive_service.list_backups(access_token, user_id).await?;

    Ok(Json(serde_json::json!({
        "backups": backups
    })))
}

pub async fn restore_backup(
    State(state): State<AppState>,
    extensions: Extensions,
    Json(payload): Json<RestoreBackupRequest>,
) -> Result<Json<serde_json::Value>> {
    let user_id = extensions.get::<Uuid>()
        .copied()
        .ok_or_else(|| AppError::Auth("User ID not found in request".to_string()))?;
    let drive_service = GoogleDriveService::new();

    // Download backup from Google Drive
    let backup_data = drive_service
        .download_backup(&payload.access_token, &payload.file_id)
        .await?;

    // Decrypt if key provided
    let final_data = if let Some(key) = payload.encryption_key {
        drive_service.decrypt_backup_data(&backup_data, &key)?
    } else {
        backup_data
    };

    // Parse backup data
    let backup: serde_json::Value = serde_json::from_str(&final_data)?;
    
    // Verify this backup belongs to the current user
    let backup_user_id = backup["user_id"]
        .as_str()
        .and_then(|s| s.parse::<uuid::Uuid>().ok())
        .ok_or_else(|| AppError::Validation("Invalid backup format".to_string()))?;

    if backup_user_id != user_id {
        return Err(AppError::Unauthorized("Backup does not belong to current user".to_string()));
    }

    // TODO: Implement actual restore logic
    // This would involve:
    // 1. Backing up current data
    // 2. Clearing current data
    // 3. Restoring from backup
    // 4. Handling conflicts

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Backup restore functionality not yet implemented"
    })))
}

pub async fn delete_backup(
    State(_state): State<AppState>,
    extensions: Extensions,
    Path(file_id): Path<String>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>> {
    let _user_id = extensions.get::<Uuid>()
        .copied()
        .ok_or_else(|| AppError::Auth("User ID not found in request".to_string()))?;
    let _user_id = Uuid::new_v4();
    let access_token = payload["access_token"]
        .as_str()
        .ok_or_else(|| AppError::Validation("access_token is required".to_string()))?;

    let drive_service = GoogleDriveService::new();
    drive_service.delete_backup(access_token, &file_id).await?;

    Ok(Json(serde_json::json!({
        "success": true
    })))
}
