use axum::{
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde_json::{json, Value};
use std::net::SocketAddr;
use tower::ServiceBuilder;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod database;
mod error;
mod handlers;
mod middleware;
mod models;
mod services;

use config::Config;
use database::Database;
use error::AppError;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "focusflow_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env()?;
    
    // Initialize database
    let database = Database::new(&config.database_url).await?;
    database.migrate().await?;

    // Build our application with routes
    let app = create_app(database, config.clone()).await?;

    // Run the server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn create_app(database: Database, config: Config) -> Result<Router, AppError> {
    let state = AppState {
        database,
        config,
    };

    let app = Router::new()
        .route("/health", get(health_check))
        .nest("/auth", handlers::auth::routes())
        .route("/auth/google-token", get(handlers::auth::get_google_token)
            .layer(axum::middleware::from_fn_with_state(
                state.clone(),
                middleware::auth_middleware,
            ))
        )
        .nest(
            "/api",
            handlers::api::routes()
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    middleware::auth_middleware,
                ))
        )
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CorsLayer::permissive()) // Configure CORS for Tauri app
                .into_inner(),
        )
        .with_state(state);

    Ok(app)
}

#[derive(Clone)]
pub struct AppState {
    pub database: Database,
    pub config: Config,
}

async fn health_check() -> Result<Json<Value>, StatusCode> {
    Ok(Json(json!({
        "status": "ok",
        "service": "focusflow-backend",
        "version": env!("CARGO_PKG_VERSION")
    })))
}
