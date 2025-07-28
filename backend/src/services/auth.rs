use oauth2::{
    basic::{BasicClient, BasicTokenType},
    reqwest::async_http_client, AuthUrl, AuthorizationCode, ClientId,
    ClientSecret, CsrfToken, RedirectUrl, RefreshToken, Scope, TokenResponse, TokenUrl,
    StandardTokenResponse,
};
use chrono::{Duration, Utc};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    config::Config,
    database::Database,
    error::{AppError, Result},
    models::{CreateUserRequest, User},
    services::JwtService,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleUserInfo {
    pub id: String,
    pub email: String,
    pub name: String,
    pub picture: Option<String>,
    pub verified_email: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: User,
}

pub struct AuthService {
    oauth_client: BasicClient,
    http_client: Client,
    jwt_service: JwtService,
    database: Database,
}

impl AuthService {
    pub fn new(config: &Config, database: Database) -> Result<Self> {
        tracing::info!("Initializing OAuth client with:");
        tracing::info!("  Client ID: {}...", &config.google_client_id[..20]);
        tracing::info!("  Redirect URI: {}", config.google_redirect_uri);

        let oauth_client = BasicClient::new(
            ClientId::new(config.google_client_id.clone()),
            Some(ClientSecret::new(config.google_client_secret.clone())),
            AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string())
                .map_err(|e| AppError::Auth(format!("Invalid auth URL: {}", e)))?,
            Some(
                TokenUrl::new("https://oauth2.googleapis.com/token".to_string())
                    .map_err(|e| AppError::Auth(format!("Invalid token URL: {}", e)))?,
            ),
        )
        .set_redirect_uri(
            RedirectUrl::new(config.google_redirect_uri.clone())
                .map_err(|e| AppError::Auth(format!("Invalid redirect URI: {}", e)))?,
        );

        Ok(Self {
            oauth_client,
            http_client: Client::new(),
            jwt_service: JwtService::new(&config.jwt_secret),
            database,
        })
    }

    pub fn get_auth_url(&self) -> (String, String) {
        let (auth_url, csrf_token) = self
            .oauth_client
            .authorize_url(CsrfToken::new_random)
            .add_scope(Scope::new("openid".to_string()))
            .add_scope(Scope::new("email".to_string()))
            .add_scope(Scope::new("profile".to_string()))
            .add_scope(Scope::new("https://www.googleapis.com/auth/drive.file".to_string()))
            .add_extra_param("access_type", "offline")
            .add_extra_param("prompt", "consent")
            .url();

        (auth_url.to_string(), csrf_token.secret().clone())
    }

    pub async fn handle_callback(&self, code: String, _state: String) -> Result<AuthResponse> {
        tracing::debug!("Starting OAuth callback with code: {}", &code[..10]);

        // Exchange authorization code for access token
        let token_result = self
            .oauth_client
            .exchange_code(AuthorizationCode::new(code))
            .request_async(async_http_client)
            .await
            .map_err(|e| {
                tracing::error!("Token exchange failed: {:?}", e);
                AppError::Auth(format!("Token exchange failed: Server returned error response"))
            })?;

        tracing::debug!("Token exchange successful");

        // Get user info from Google
        let user_info = self.get_google_user_info(token_result.access_token().secret()).await
            .map_err(|e| {
                tracing::error!("Failed to get user info: {:?}", e);
                e
            })?;

        if !user_info.verified_email {
            return Err(AppError::Auth("Email not verified".to_string()));
        }

        // Create or update user in database
        let user = self.create_or_update_user(user_info, &token_result).await?;

        // Generate JWT token
        let token = self.jwt_service.generate_token(user.id, &user.email, &user.name)?;

        Ok(AuthResponse { token, user })
    }

    async fn get_google_user_info(&self, access_token: &str) -> Result<GoogleUserInfo> {
        tracing::debug!("Fetching user info from Google");

        let response = self
            .http_client
            .get("https://www.googleapis.com/oauth2/v2/userinfo")
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Failed to send request to Google userinfo endpoint: {:?}", e);
                AppError::Auth(format!("Failed to contact Google API: {}", e))
            })?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            tracing::error!("Google userinfo API returned error: {} - {}", status, error_text);
            return Err(AppError::Auth(format!("Google API error: {} - {}", status, error_text)));
        }

        let user_info: GoogleUserInfo = response.json().await
            .map_err(|e| {
                tracing::error!("Failed to parse Google user info response: {:?}", e);
                AppError::Auth("Invalid response from Google API".to_string())
            })?;

        tracing::debug!("Successfully retrieved user info for: {}", user_info.email);
        Ok(user_info)
    }

    async fn create_or_update_user(
        &self,
        user_info: GoogleUserInfo,
        token_response: &StandardTokenResponse<oauth2::EmptyExtraTokenFields, BasicTokenType>
    ) -> Result<User> {
        // Check if user already exists
        let existing_user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE google_id = $1 OR email = $2"
        )
        .bind(&user_info.id)
        .bind(&user_info.email)
        .fetch_optional(self.database.pool())
        .await?;

        // Calculate token expiration time (Google tokens typically expire in 1 hour)
        let expires_at = token_response.expires_in()
            .map(|duration| Utc::now() + Duration::seconds(duration.as_secs() as i64));

        let refresh_token = token_response.refresh_token().map(|t| t.secret().clone());
        tracing::info!("OAuth token response - has refresh token: {}", refresh_token.is_some());

        if let Some(mut user) = existing_user {
            // Update existing user with new token info
            user.name = user_info.name;
            user.profile_picture = user_info.picture;
            user.google_access_token = Some(token_response.access_token().secret().clone());

            // Only update refresh token if we got a new one, otherwise keep the existing one
            if refresh_token.is_some() {
                user.google_refresh_token = refresh_token;
                tracing::info!("Updated refresh token for existing user");
            } else {
                tracing::warn!("No refresh token in response, keeping existing one");
            }

            user.google_token_expires_at = expires_at;

            sqlx::query!(
                "UPDATE users SET name = $1, profile_picture = $2, google_access_token = $3, google_refresh_token = $4, google_token_expires_at = $5, updated_at = NOW() WHERE id = $6",
                user.name,
                user.profile_picture,
                user.google_access_token,
                user.google_refresh_token,
                user.google_token_expires_at,
                user.id
            )
            .execute(self.database.pool())
            .await?;

            Ok(user)
        } else {
            // Create new user
            let create_request = CreateUserRequest {
                google_id: user_info.id,
                email: user_info.email,
                name: user_info.name,
                profile_picture: user_info.picture,
            };

            tracing::info!("Creating new user with refresh token: {}", refresh_token.is_some());

            let user = sqlx::query_as::<_, User>(
                r#"
                INSERT INTO users (google_id, email, name, profile_picture, google_access_token, google_refresh_token, google_token_expires_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
                "#
            )
            .bind(&create_request.google_id)
            .bind(&create_request.email)
            .bind(&create_request.name)
            .bind(&create_request.profile_picture)
            .bind(token_response.access_token().secret())
            .bind(&refresh_token)
            .bind(expires_at)
            .fetch_one(self.database.pool())
            .await?;

            Ok(user)
        }
    }

    pub fn verify_token(&self, token: &str) -> Result<Uuid> {
        self.jwt_service.extract_user_id(token)
    }

    pub async fn refresh_google_token(&self, user_id: Uuid) -> Result<String> {
        tracing::debug!("Refreshing Google token for user: {}", user_id);

        // Get user with refresh token
        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE id = $1"
        )
        .bind(user_id)
        .fetch_optional(self.database.pool())
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

        let refresh_token = user.google_refresh_token
            .ok_or_else(|| {
                tracing::error!("No refresh token available for user {}. User needs to re-authenticate.", user_id);
                AppError::Auth("No refresh token available. Please re-authenticate with Google.".to_string())
            })?;

        // Use the refresh token to get a new access token
        let token_result = self
            .oauth_client
            .exchange_refresh_token(&oauth2::RefreshToken::new(refresh_token))
            .request_async(async_http_client)
            .await
            .map_err(|e| {
                tracing::error!("Token refresh failed: {:?}", e);
                AppError::Auth(format!("Token refresh failed: {}", e))
            })?;

        // Calculate new expiration time
        let expires_at = token_result.expires_in()
            .map(|duration| Utc::now() + Duration::seconds(duration.as_secs() as i64));

        let new_access_token = token_result.access_token().secret().clone();

        // Update the user's access token in the database
        sqlx::query!(
            "UPDATE users SET google_access_token = $1, google_token_expires_at = $2, updated_at = NOW() WHERE id = $3",
            new_access_token,
            expires_at,
            user_id
        )
        .execute(self.database.pool())
        .await?;

        tracing::info!("Successfully refreshed Google token for user: {}", user_id);
        Ok(new_access_token)
    }

    pub async fn get_valid_google_token(&self, user_id: Uuid) -> Result<String> {
        tracing::debug!("Getting valid Google token for user: {}", user_id);

        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE id = $1"
        )
        .bind(user_id)
        .fetch_optional(self.database.pool())
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

        let access_token = user.google_access_token
            .ok_or_else(|| AppError::Auth("No Google access token found".to_string()))?;

        // Check if token is expired or will expire soon (within 5 minutes)
        if let Some(expires_at) = user.google_token_expires_at {
            let now = Utc::now();
            let buffer = Duration::minutes(5);

            if expires_at <= now + buffer {
                tracing::info!("Google token expired or expiring soon, attempting refresh...");
                match self.refresh_google_token(user_id).await {
                    Ok(new_token) => return Ok(new_token),
                    Err(e) => {
                        tracing::error!("Failed to refresh token, clearing user tokens: {:?}", e);
                        // Clear the user's tokens to force re-authentication
                        self.clear_user_tokens(user_id).await?;
                        return Err(AppError::Auth("LOGOUT_REQUIRED".to_string()));
                    }
                }
            }
        } else {
            tracing::warn!("No expiration time set for Google token, assuming it might be expired");
            // If we don't have an expiration time, try to refresh if we have a refresh token
            if user.google_refresh_token.is_some() {
                match self.refresh_google_token(user_id).await {
                    Ok(new_token) => return Ok(new_token),
                    Err(_) => {
                        tracing::warn!("Token refresh failed, clearing user tokens");
                        self.clear_user_tokens(user_id).await?;
                        return Err(AppError::Auth("LOGOUT_REQUIRED".to_string()));
                    }
                }
            } else {
                // No refresh token available, clear tokens and force re-auth
                tracing::warn!("No refresh token available, clearing user tokens");
                self.clear_user_tokens(user_id).await?;
                return Err(AppError::Auth("LOGOUT_REQUIRED".to_string()));
            }
        }

        tracing::debug!("Using existing Google token");
        Ok(access_token)
    }

    async fn clear_user_tokens(&self, user_id: Uuid) -> Result<()> {
        tracing::info!("Clearing Google tokens for user: {}", user_id);

        sqlx::query!(
            "UPDATE users SET google_access_token = NULL, google_refresh_token = NULL, google_token_expires_at = NULL WHERE id = $1",
            user_id
        )
        .execute(self.database.pool())
        .await?;

        Ok(())
    }
}
