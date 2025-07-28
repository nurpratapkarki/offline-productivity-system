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
    models::{CreateTaskRequest, Task, TaskResponse, TaskStatus, TaskPriority, UpdateTaskRequest},
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct TasksQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub status: Option<TaskStatus>,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_tasks).post(create_task))
        .route("/:id", get(get_task).put(update_task).delete(delete_task))
}

pub async fn list_tasks(
    State(state): State<AppState>,
    Query(query): Query<TasksQuery>,
    request: Request<axum::body::Body>,
) -> Result<Json<Vec<TaskResponse>>> {
    let user_id = extract_user_id(&request)?;
    let limit = query.limit.unwrap_or(50);
    let offset = query.offset.unwrap_or(0);

    let tasks = if let Some(status) = query.status {
        sqlx::query_as!(
            Task,
            r#"
            SELECT id, user_id, title, description, 
                   status as "status: TaskStatus", 
                   priority as "priority: crate::models::TaskPriority",
                   created_at, updated_at, version, deleted_at
            FROM tasks 
            WHERE user_id = $1 AND deleted_at IS NULL AND status = $2
            ORDER BY updated_at DESC 
            LIMIT $3 OFFSET $4
            "#,
            user_id,
            status as TaskStatus,
            limit,
            offset
        )
        .fetch_all(state.database.pool())
        .await?
    } else {
        sqlx::query_as!(
            Task,
            r#"
            SELECT id, user_id, title, description, 
                   status as "status: TaskStatus", 
                   priority as "priority: crate::models::TaskPriority",
                   created_at, updated_at, version, deleted_at
            FROM tasks 
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

    let responses: Vec<TaskResponse> = tasks.into_iter().map(TaskResponse::from).collect();
    Ok(Json(responses))
}

pub async fn get_task(
    State(state): State<AppState>,
    Path(task_id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<Json<TaskResponse>> {
    let user_id = extract_user_id(&request)?;

    let task = sqlx::query_as!(
        Task,
        r#"
        SELECT id, user_id, title, description, 
               status as "status: TaskStatus", 
               priority as "priority: crate::models::TaskPriority",
               created_at, updated_at, version, deleted_at
        FROM tasks 
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        "#,
        task_id,
        user_id
    )
    .fetch_optional(state.database.pool())
    .await?
    .ok_or_else(|| AppError::NotFound("Task not found".to_string()))?;

    Ok(Json(TaskResponse::from(task)))
}

pub async fn create_task(
    State(state): State<AppState>,
    Json(payload): Json<CreateTaskRequest>,
) -> Result<Json<TaskResponse>> {
    // For now, use a dummy user ID - in production this would come from JWT token
    let user_id = Uuid::new_v4();

    let task = sqlx::query_as!(
        Task,
        r#"
        INSERT INTO tasks (user_id, title, description, status, priority)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, title, description, 
                  status as "status: TaskStatus", 
                  priority as "priority: crate::models::TaskPriority",
                  created_at, updated_at, version, deleted_at
        "#,
        user_id,
        payload.title,
        payload.description,
        payload.status as TaskStatus,
        payload.priority as crate::models::TaskPriority
    )
    .fetch_one(state.database.pool())
    .await?;

    Ok(Json(TaskResponse::from(task)))
}

pub async fn update_task(
    State(state): State<AppState>,
    Path(task_id): Path<Uuid>,
    Json(payload): Json<UpdateTaskRequest>,
) -> Result<Json<TaskResponse>> {
    // For now, use a dummy user ID - in production this would come from JWT token
    let user_id = Uuid::new_v4();

    // Check if task exists and version matches
    let existing_task = sqlx::query!(
        "SELECT version FROM tasks WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
        task_id,
        user_id
    )
    .fetch_optional(state.database.pool())
    .await?
    .ok_or_else(|| AppError::NotFound("Task not found".to_string()))?;

    if existing_task.version != payload.version {
        return Err(AppError::Conflict("Task has been modified by another client".to_string()));
    }

    let task_record = sqlx::query!(
        r#"
        UPDATE tasks
        SET title = COALESCE($1, title),
            description = COALESCE($2, description),
            version = version + 1,
            updated_at = NOW()
        WHERE id = $3 AND user_id = $4 AND deleted_at IS NULL
        RETURNING id, user_id, title, description, created_at, updated_at, version, deleted_at
        "#,
        payload.title,
        payload.description,
        task_id,
        user_id
    )
    .fetch_one(state.database.pool())
    .await?;

    // Create a simplified task response
    let task_response = TaskResponse {
        id: task_record.id,
        title: task_record.title,
        description: task_record.description,
        status: TaskStatus::Todo, // Default status for now
        priority: TaskPriority::Medium, // Default priority for now
        created_at: task_record.created_at,
        updated_at: task_record.updated_at,
        version: task_record.version,
    };

    Ok(Json(task_response))
}

pub async fn delete_task(
    State(state): State<AppState>,
    Path(task_id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<Json<serde_json::Value>> {
    let user_id = extract_user_id(&request)?;

    let result = sqlx::query!(
        "UPDATE tasks SET deleted_at = NOW(), version = version + 1 WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
        task_id,
        user_id
    )
    .execute(state.database.pool())
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Task not found".to_string()));
    }

    Ok(Json(serde_json::json!({ "success": true })))
}
