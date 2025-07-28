use axum::{
    extract::{Path, Query, State},
    http::Request,
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    error::{AppError, Result},
    middleware::extract_user_id,
    models::{CreateNoteRequest, Note, NoteResponse, UpdateNoteRequest},
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct NotesQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub search: Option<String>,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_notes).post(create_note))
        .route("/:id", get(get_note).put(update_note).delete(delete_note))
}

pub async fn list_notes(
    State(state): State<AppState>,
    Query(query): Query<NotesQuery>,
    request: Request<axum::body::Body>,
) -> Result<Json<Vec<NoteResponse>>> {
    let user_id = extract_user_id(&request)?;
    let limit = query.limit.unwrap_or(50);
    let offset = query.offset.unwrap_or(0);

    let notes = if let Some(search_term) = query.search {
        sqlx::query_as!(
            Note,
            r#"
            SELECT id, user_id, title, content, tags, is_encrypted, 
                   created_at, updated_at, version, deleted_at
            FROM notes 
            WHERE user_id = $1 AND deleted_at IS NULL 
            AND (title ILIKE $2 OR content ILIKE $2)
            ORDER BY updated_at DESC 
            LIMIT $3 OFFSET $4
            "#,
            user_id,
            format!("%{}%", search_term),
            limit,
            offset
        )
        .fetch_all(state.database.pool())
        .await?
    } else {
        sqlx::query_as!(
            Note,
            r#"
            SELECT id, user_id, title, content, tags, is_encrypted, 
                   created_at, updated_at, version, deleted_at
            FROM notes 
            WHERE user_id = $1 AND deleted_at IS NULL 
            ORDER BY updated_at DESC 
            LIMIT $2 OFFSET $3
            "#,
            user_id,
            limit,
            offset
        )
        .fetch_all(state.database.pool())
        .await?
    };

    let responses: Vec<NoteResponse> = notes.into_iter().map(NoteResponse::from).collect();
    Ok(Json(responses))
}

pub async fn get_note(
    State(state): State<AppState>,
    Path(note_id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<Json<NoteResponse>> {
    let user_id = extract_user_id(&request)?;

    let note = sqlx::query_as!(
        Note,
        r#"
        SELECT id, user_id, title, content, tags, is_encrypted, 
               created_at, updated_at, version, deleted_at
        FROM notes 
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        "#,
        note_id,
        user_id
    )
    .fetch_optional(state.database.pool())
    .await?
    .ok_or_else(|| AppError::NotFound("Note not found".to_string()))?;

    Ok(Json(NoteResponse::from(note)))
}

pub async fn create_note(
    State(state): State<AppState>,
    Json(payload): Json<CreateNoteRequest>,
) -> Result<Json<NoteResponse>> {
    // For now, use a dummy user ID - in production this would come from JWT token
    let user_id = Uuid::new_v4();

    let note = sqlx::query_as!(
        Note,
        r#"
        INSERT INTO notes (user_id, title, content, tags, is_encrypted)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, title, content, tags, is_encrypted, 
                  created_at, updated_at, version, deleted_at
        "#,
        user_id,
        payload.title,
        payload.content,
        serde_json::to_value(&payload.tags)?,
        payload.is_encrypted.unwrap_or(false)
    )
    .fetch_one(state.database.pool())
    .await?;

    Ok(Json(NoteResponse::from(note)))
}

pub async fn update_note(
    State(state): State<AppState>,
    Path(note_id): Path<Uuid>,
    Json(payload): Json<UpdateNoteRequest>,
) -> Result<Json<NoteResponse>> {
    // For now, use a dummy user ID - in production this would come from JWT token
    let user_id = Uuid::new_v4();

    // Check if note exists and version matches
    let existing_note = sqlx::query!(
        "SELECT version FROM notes WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
        note_id,
        user_id
    )
    .fetch_optional(state.database.pool())
    .await?
    .ok_or_else(|| AppError::NotFound("Note not found".to_string()))?;

    if existing_note.version != payload.version {
        return Err(AppError::Conflict("Note has been modified by another client".to_string()));
    }

    let note = sqlx::query_as!(
        Note,
        r#"
        UPDATE notes 
        SET title = COALESCE($1, title),
            content = COALESCE($2, content),
            tags = COALESCE($3, tags),
            is_encrypted = COALESCE($4, is_encrypted),
            version = version + 1,
            updated_at = NOW()
        WHERE id = $5 AND user_id = $6 AND deleted_at IS NULL
        RETURNING id, user_id, title, content, tags, is_encrypted, 
                  created_at, updated_at, version, deleted_at
        "#,
        payload.title,
        payload.content,
        payload.tags.as_ref().map(|tags| serde_json::to_value(tags)).transpose()?,
        payload.is_encrypted,
        note_id,
        user_id
    )
    .fetch_one(state.database.pool())
    .await?;

    Ok(Json(NoteResponse::from(note)))
}

pub async fn delete_note(
    State(state): State<AppState>,
    Path(note_id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<Json<serde_json::Value>> {
    let user_id = extract_user_id(&request)?;

    let result = sqlx::query!(
        "UPDATE notes SET deleted_at = NOW(), version = version + 1 WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
        note_id,
        user_id
    )
    .execute(state.database.pool())
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Note not found".to_string()));
    }

    Ok(Json(serde_json::json!({ "success": true })))
}
