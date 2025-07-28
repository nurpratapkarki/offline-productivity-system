use axum::{
    extract::{Query, State},
    http::Extensions,
    middleware,
    response::{Json, Redirect},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::{
    error::{AppError, Result},
    models::User,
    services::AuthService,
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct AuthCallbackQuery {
    pub code: String,
    pub state: String,
}

#[derive(Debug, Serialize)]
pub struct AuthUrlResponse {
    pub auth_url: String,
    pub state: String,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/google", get(google_auth))
        .route("/google/callback", get(google_callback))
        .route("/verify", post(verify_token))
}

pub async fn google_auth(State(state): State<AppState>) -> Result<Json<AuthUrlResponse>> {
    let auth_service = AuthService::new(&state.config, state.database)?;
    let (auth_url, csrf_state) = auth_service.get_auth_url();

    Ok(Json(AuthUrlResponse {
        auth_url,
        state: csrf_state,
    }))
}

pub async fn google_callback(
    State(state): State<AppState>,
    Query(params): Query<AuthCallbackQuery>,
) -> Result<Redirect> {
    let auth_service = AuthService::new(&state.config, state.database)?;
    let auth_response = auth_service.handle_callback(params.code, params.state).await?;

    // In a real app, you might want to redirect to your frontend with the token
    // For now, we'll redirect to a success page
    let redirect_url = format!(
        "{}?token={}&user_id={}",
        state.config.frontend_url, auth_response.token, auth_response.user.id
    );

    Ok(Redirect::to(&redirect_url))
}

#[derive(Debug, Deserialize)]
pub struct VerifyTokenRequest {
    pub token: String,
}

pub async fn verify_token(
    State(state): State<AppState>,
    Json(payload): Json<VerifyTokenRequest>,
) -> Result<Json<Value>> {
    let auth_service = AuthService::new(&state.config, state.database.clone())?;
    let user_id = auth_service.verify_token(&payload.token)?;

    // Get user details
    let user = sqlx::query_as!(
        crate::models::User,
        "SELECT * FROM users WHERE id = $1",
        user_id
    )
    .fetch_optional(state.database.pool())
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(json!({
        "valid": true,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "profile_picture": user.profile_picture
        }
    })))
}

pub async fn get_google_token(
    State(state): State<AppState>,
    extensions: Extensions,
) -> Result<Json<serde_json::Value>> {
    let user_id = extensions.get::<uuid::Uuid>()
        .copied()
        .ok_or_else(|| AppError::Auth("User ID not found in request".to_string()))?;

    let auth_service = AuthService::new(&state.config, state.database.clone())?;
    let access_token = auth_service.get_valid_google_token(user_id).await?;

    // Get updated user info to return expiration time
    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE id = $1"
    )
    .bind(user_id)
    .fetch_optional(state.database.pool())
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(json!({
        "access_token": access_token,
        "expires_at": user.google_token_expires_at
    })))
}
