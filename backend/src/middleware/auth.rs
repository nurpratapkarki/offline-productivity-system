use axum::{
    extract::State,
    http::{header::AUTHORIZATION, Request, StatusCode},
    middleware::Next,
    response::Response,
};
use uuid::Uuid;

use crate::{error::AppError, services::JwtService, AppState};

pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, AppError> {
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .and_then(|header| header.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => {
            return Err(AppError::Auth("Missing authorization header".to_string()));
        }
    };

    let jwt_service = JwtService::new(&state.config.jwt_secret);
    let user_id = jwt_service.extract_user_id(token)?;

    // Add user_id to request extensions for use in handlers
    request.extensions_mut().insert(user_id);

    Ok(next.run(request).await)
}

pub fn extract_user_id(request: &Request<axum::body::Body>) -> Result<Uuid, AppError> {
    request
        .extensions()
        .get::<Uuid>()
        .copied()
        .ok_or_else(|| AppError::Auth("User ID not found in request".to_string()))
}
