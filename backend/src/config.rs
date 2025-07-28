use anyhow::Result;
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub database_url: String,
    pub port: u16,
    pub jwt_secret: String,
    pub google_client_id: String,
    pub google_client_secret: String,
    pub google_redirect_uri: String,
    pub frontend_url: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenvy::dotenv().ok();

        let jwt_secret = std::env::var("JWT_SECRET")
            .unwrap_or_else(|_| {
                eprintln!("⚠️  WARNING: Using default JWT secret for development. Change JWT_SECRET in production!");
                "focusflow-dev-jwt-secret-key-2024-change-in-production-make-it-long-and-secure".to_string()
            });

        let google_client_id = std::env::var("GOOGLE_CLIENT_ID")
            .unwrap_or_else(|_| {
                eprintln!("ℹ️  INFO: Using demo Google OAuth credentials. Set GOOGLE_CLIENT_ID for real authentication.");
                "demo-client-id.apps.googleusercontent.com".to_string()
            });

        let google_client_secret = std::env::var("GOOGLE_CLIENT_SECRET")
            .unwrap_or_else(|_| "demo-client-secret".to_string());

        let config = Config {
            database_url: std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://localhost/focusflow".to_string()),
            port: std::env::var("PORT")
                .unwrap_or_else(|_| "3001".to_string())
                .parse()?,
            jwt_secret,
            google_client_id,
            google_client_secret,
            google_redirect_uri: std::env::var("GOOGLE_REDIRECT_URI")
                .unwrap_or_else(|_| "http://localhost:3001/auth/google/callback".to_string()),
            frontend_url: std::env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:5173".to_string()),
        };

        Ok(config)
    }
}
