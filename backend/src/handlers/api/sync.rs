use axum::{
    extract::State,
    http::Request,
    response::Json,
    routing::post,
    Router,
};
use uuid::Uuid;

use crate::{
    error::Result,
    middleware::extract_user_id,
    models::{SyncRequest, SyncResponse},
    services::SyncService,
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", post(sync_data))
        .route("/status", post(get_sync_status))
}

pub async fn sync_data(
    State(state): State<AppState>,
    Json(payload): Json<SyncRequest>,
) -> Result<Json<SyncResponse>> {
    // For now, use a dummy user ID - in production this would come from JWT token
    let user_id = Uuid::new_v4();
    let sync_service = SyncService::new(state.database.clone());
    
    let response = sync_service.sync_user_data(user_id, payload).await?;
    Ok(Json(response))
}

pub async fn get_sync_status(
    State(state): State<AppState>,
    request: Request<axum::body::Body>,
) -> Result<Json<serde_json::Value>> {
    let user_id = extract_user_id(&request)?;
    let sync_service = SyncService::new(state.database.clone());
    
    let status = sync_service.get_sync_status(user_id).await?;
    Ok(Json(serde_json::json!({ "status": status })))
}
