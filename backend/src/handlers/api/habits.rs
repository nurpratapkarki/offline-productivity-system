use axum::{
    extract::{Path, State},
    http::Request,
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use uuid::Uuid;

use crate::{
    error::{AppError, Result},
    middleware::extract_user_id,
    models::{CreateHabitRequest, Habit, HabitResponse, UpdateHabitRequest},
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_habits).post(create_habit))
        .route("/:id", get(get_habit).put(update_habit).delete(delete_habit))
}

pub async fn list_habits(
    State(state): State<AppState>,
    request: Request<axum::body::Body>,
) -> Result<Json<Vec<HabitResponse>>> {
    let user_id = extract_user_id(&request)?;

    let habits = sqlx::query_as!(
        Habit,
        r#"
        SELECT id, user_id, name, color, streak, completed_dates, 
               created_at, updated_at, version, deleted_at
        FROM habits 
        WHERE user_id = $1 AND deleted_at IS NULL 
        ORDER BY created_at DESC
        "#,
        user_id
    )
    .fetch_all(state.database.pool())
    .await?;

    let responses: Vec<HabitResponse> = habits.into_iter().map(HabitResponse::from).collect();
    Ok(Json(responses))
}

pub async fn get_habit(
    State(state): State<AppState>,
    Path(habit_id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<Json<HabitResponse>> {
    let user_id = extract_user_id(&request)?;

    let habit = sqlx::query_as!(
        Habit,
        r#"
        SELECT id, user_id, name, color, streak, completed_dates, 
               created_at, updated_at, version, deleted_at
        FROM habits 
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        "#,
        habit_id,
        user_id
    )
    .fetch_optional(state.database.pool())
    .await?
    .ok_or_else(|| AppError::NotFound("Habit not found".to_string()))?;

    Ok(Json(HabitResponse::from(habit)))
}

pub async fn create_habit(
    State(state): State<AppState>,
    Json(payload): Json<CreateHabitRequest>,
) -> Result<Json<HabitResponse>> {
    // For now, use a dummy user ID - in production this would come from JWT token
    let user_id = Uuid::new_v4();

    let habit = sqlx::query_as!(
        Habit,
        r#"
        INSERT INTO habits (user_id, name, color)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, name, color, streak, completed_dates, 
                  created_at, updated_at, version, deleted_at
        "#,
        user_id,
        payload.name,
        payload.color
    )
    .fetch_one(state.database.pool())
    .await?;

    Ok(Json(HabitResponse::from(habit)))
}

pub async fn update_habit(
    State(state): State<AppState>,
    Path(habit_id): Path<Uuid>,
    Json(payload): Json<UpdateHabitRequest>,
) -> Result<Json<HabitResponse>> {
    // For now, use a dummy user ID - in production this would come from JWT token
    let user_id = Uuid::new_v4();

    // Check if habit exists and version matches
    let existing_habit = sqlx::query!(
        "SELECT version FROM habits WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
        habit_id,
        user_id
    )
    .fetch_optional(state.database.pool())
    .await?
    .ok_or_else(|| AppError::NotFound("Habit not found".to_string()))?;

    if existing_habit.version != payload.version {
        return Err(AppError::Conflict("Habit has been modified by another client".to_string()));
    }

    let habit = sqlx::query_as!(
        Habit,
        r#"
        UPDATE habits 
        SET name = COALESCE($1, name),
            color = COALESCE($2, color),
            streak = COALESCE($3, streak),
            completed_dates = COALESCE($4, completed_dates),
            version = version + 1,
            updated_at = NOW()
        WHERE id = $5 AND user_id = $6 AND deleted_at IS NULL
        RETURNING id, user_id, name, color, streak, completed_dates, 
                  created_at, updated_at, version, deleted_at
        "#,
        payload.name,
        payload.color,
        payload.streak,
        payload.completed_dates.as_ref().map(|dates| serde_json::to_value(dates)).transpose()?,
        habit_id,
        user_id
    )
    .fetch_one(state.database.pool())
    .await?;

    Ok(Json(HabitResponse::from(habit)))
}

pub async fn delete_habit(
    State(state): State<AppState>,
    Path(habit_id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<Json<serde_json::Value>> {
    let user_id = extract_user_id(&request)?;

    let result = sqlx::query!(
        "UPDATE habits SET deleted_at = NOW(), version = version + 1 WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
        habit_id,
        user_id
    )
    .execute(state.database.pool())
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Habit not found".to_string()));
    }

    Ok(Json(serde_json::json!({ "success": true })))
}
