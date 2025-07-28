use base64::{engine::general_purpose, Engine as _};
use reqwest::{multipart, Client};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

use crate::error::{AppError, Result};

#[derive(Debug, Serialize, Deserialize)]
pub struct DriveFile {
    pub id: String,
    pub name: String,
    pub size: Option<String>,
    #[serde(rename(deserialize = "modifiedTime", serialize = "modified_time"))]
    pub modified_time: Option<String>,
    #[serde(rename(deserialize = "createdTime", serialize = "created_time"))]
    pub created_time: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DriveFileList {
    pub files: Vec<DriveFile>,
    #[serde(rename = "nextPageToken")]
    pub next_page_token: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DriveFileUploadResponse {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupMetadata {
    pub user_id: Uuid,
    pub backup_type: String,
    pub created_at: String,
    pub version: String,
    pub entities_count: usize,
}

pub struct GoogleDriveService {
    http_client: Client,
}

impl GoogleDriveService {
    pub fn new() -> Self {
        Self {
            http_client: Client::new(),
        }
    }

    pub async fn upload_backup(
        &self,
        access_token: &str,
        user_id: Uuid,
        backup_data: &str,
        backup_name: &str,
    ) -> Result<String> {
        tracing::debug!("Checking for existing backup file");

        // Check if a backup file already exists
        if let Some(existing_file) = self.find_current_backup_file(access_token, user_id).await? {
            tracing::info!("Found existing backup file: {}, updating it", existing_file.id);
            self.update_backup_file(access_token, &existing_file.id, backup_data).await?;
            return Ok(existing_file.id);
        }

        // No existing file found, create a new one
        tracing::info!("No existing backup found, creating new backup file: {}", backup_name);
        tracing::debug!("Getting or creating app folder");
        let app_folder_id = self.get_or_create_app_folder(access_token).await?;
        tracing::debug!("App folder ID: {}", app_folder_id);

        let metadata = json!({
            "name": backup_name,
            "parents": [app_folder_id],
            "description": format!("FocusFlow backup for user {}", user_id)
        });

        // First create the file with metadata
        tracing::debug!("Creating file metadata");
        let create_response = self
            .http_client
            .post("https://www.googleapis.com/drive/v3/files")
            .bearer_auth(access_token)
            .json(&metadata)
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Failed to create file metadata: {:?}", e);
                AppError::GoogleApi(format!("File creation failed: {}", e))
            })?;

        if !create_response.status().is_success() {
            let status = create_response.status();
            let error_text = create_response.text().await?;
            tracing::error!("File creation failed with status {}: {}", status, error_text);
            return Err(AppError::GoogleApi(format!("File creation failed ({}): {}", status, error_text)));
        }

        let file_info: DriveFileUploadResponse = create_response.json().await
            .map_err(|e| {
                tracing::error!("Failed to parse file creation response: {:?}", e);
                AppError::GoogleApi(format!("Invalid response format: {}", e))
            })?;

        // Now upload the content to the created file
        tracing::debug!("Uploading content to file: {}", file_info.id);
        let response = self
            .http_client
            .patch(&format!("https://www.googleapis.com/upload/drive/v3/files/{}?uploadType=media", file_info.id))
            .bearer_auth(access_token)
            .header("Content-Type", "application/json")
            .body(backup_data.to_string())
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Failed to upload content: {:?}", e);
                AppError::GoogleApi(format!("Content upload failed: {}", e))
            })?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            tracing::error!("Content upload failed with status {}: {}", status, error_text);
            return Err(AppError::GoogleApi(format!("Content upload failed ({}): {}", status, error_text)));
        }

        tracing::debug!("Upload completed successfully, file ID: {}", file_info.id);
        Ok(file_info.id)
    }

    pub async fn download_backup(&self, access_token: &str, file_id: &str) -> Result<String> {
        let response = self
            .http_client
            .get(&format!("https://www.googleapis.com/drive/v3/files/{}", file_id))
            .query(&[("alt", "media")])
            .bearer_auth(access_token)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(AppError::GoogleApi(format!("Download failed: {}", error_text)));
        }

        let content = response.text().await?;
        Ok(content)
    }

    pub async fn list_backups(&self, access_token: &str, user_id: Uuid) -> Result<Vec<DriveFile>> {
        tracing::info!("Starting list_backups for user: {}", user_id);

        let app_folder_id = match self.get_or_create_app_folder(access_token).await {
            Ok(folder_id) => {
                tracing::debug!("Successfully got app folder ID: {}", folder_id);
                folder_id
            }
            Err(e) => {
                tracing::error!("Failed to get or create app folder: {:?}", e);
                return Err(e);
            }
        };

        let query = format!(
            "'{}' in parents and name contains 'focusflow-backup-{}'",
            app_folder_id, user_id
        );
        tracing::debug!("Using query: {}", query);

        let response = self
            .http_client
            .get("https://www.googleapis.com/drive/v3/files")
            .query(&[
                ("q", &query),
                ("orderBy", &"modifiedTime desc".to_string()),
                ("fields", &"files(id,name,size,modifiedTime,createdTime)".to_string()),
            ])
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| {
                tracing::error!("HTTP request to Google Drive API failed: {:?}", e);
                AppError::GoogleApi(format!("Request failed: {}", e))
            })?;

        tracing::debug!("Google Drive API response status: {}", response.status());

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            tracing::error!("Google Drive API error - Status: {}, Response: {}", status, error_text);
            return Err(AppError::GoogleApi(format!("List failed ({}): {}", status, error_text)));
        }

        let file_list: DriveFileList = response.json().await
            .map_err(|e| {
                tracing::error!("Failed to parse Google Drive API response: {:?}", e);
                AppError::GoogleApi(format!("Invalid response format: {}", e))
            })?;

        tracing::info!("Successfully listed {} backup files", file_list.files.len());
        Ok(file_list.files)
    }

    pub async fn delete_backup(&self, access_token: &str, file_id: &str) -> Result<()> {
        let response = self
            .http_client
            .delete(&format!("https://www.googleapis.com/drive/v3/files/{}", file_id))
            .bearer_auth(access_token)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(AppError::GoogleApi(format!("Delete failed: {}", error_text)));
        }

        Ok(())
    }

    async fn get_or_create_app_folder(&self, access_token: &str) -> Result<String> {
        tracing::debug!("Getting or creating app folder");

        // First, try to find existing app folder
        let query = "name='FocusFlow Backups' and mimeType='application/vnd.google-apps.folder'";
        tracing::debug!("Searching for existing folder with query: {}", query);

        let response = self
            .http_client
            .get("https://www.googleapis.com/drive/v3/files")
            .query(&[("q", query)])
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Failed to search for app folder: {:?}", e);
                AppError::GoogleApi(format!("Folder search failed: {}", e))
            })?;

        tracing::debug!("Folder search response status: {}", response.status());

        if response.status().is_success() {
            let file_list: DriveFileList = response.json().await
                .map_err(|e| {
                    tracing::error!("Failed to parse folder search response: {:?}", e);
                    AppError::GoogleApi(format!("Invalid search response: {}", e))
                })?;

            if let Some(folder) = file_list.files.first() {
                tracing::info!("Found existing app folder: {}", folder.id);
                return Ok(folder.id.clone());
            }
            tracing::debug!("No existing app folder found");
        } else {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            tracing::error!("Folder search failed - Status: {}, Response: {}", status, error_text);
            return Err(AppError::GoogleApi(format!("Folder search failed ({}): {}", status, error_text)));
        }

        // Create new app folder if not found
        tracing::info!("Creating new app folder");
        let folder_metadata = json!({
            "name": "FocusFlow Backups",
            "mimeType": "application/vnd.google-apps.folder",
            "description": "Backup folder for FocusFlow productivity app"
        });

        let response = self
            .http_client
            .post("https://www.googleapis.com/drive/v3/files")
            .bearer_auth(access_token)
            .json(&folder_metadata)
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Failed to create app folder: {:?}", e);
                AppError::GoogleApi(format!("Folder creation request failed: {}", e))
            })?;

        tracing::debug!("Folder creation response status: {}", response.status());

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            tracing::error!("Folder creation failed - Status: {}, Response: {}", status, error_text);
            return Err(AppError::GoogleApi(format!("Folder creation failed ({}): {}", status, error_text)));
        }

        let folder: DriveFileUploadResponse = response.json().await
            .map_err(|e| {
                tracing::error!("Failed to parse folder creation response: {:?}", e);
                AppError::GoogleApi(format!("Invalid folder creation response: {}", e))
            })?;

        tracing::info!("Successfully created app folder: {}", folder.id);
        Ok(folder.id)
    }

    pub fn create_backup_name(user_id: Uuid) -> String {
        format!("focusflow-backup-{}.json", user_id)
    }

    pub async fn find_current_backup_file(&self, access_token: &str, user_id: Uuid) -> Result<Option<DriveFile>> {
        let app_folder_id = self.get_or_create_app_folder(access_token).await?;
        let expected_name = Self::create_backup_name(user_id);

        let query = format!(
            "'{}' in parents and name = '{}'",
            app_folder_id, expected_name
        );

        let response = self
            .http_client
            .get("https://www.googleapis.com/drive/v3/files")
            .query(&[
                ("q", &query),
                ("fields", &"files(id,name,size,modifiedTime,createdTime)".to_string()),
            ])
            .bearer_auth(access_token)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(AppError::GoogleApi(format!("Search failed: {}", error_text)));
        }

        let file_list: DriveFileList = response.json().await?;
        Ok(file_list.files.into_iter().next())
    }

    pub async fn update_backup_file(&self, access_token: &str, file_id: &str, backup_data: &str) -> Result<()> {
        tracing::debug!("Updating existing backup file: {}", file_id);

        let response = self
            .http_client
            .patch(&format!("https://www.googleapis.com/upload/drive/v3/files/{}?uploadType=media", file_id))
            .bearer_auth(access_token)
            .header("Content-Type", "application/json")
            .body(backup_data.to_string())
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Failed to update backup file: {:?}", e);
                AppError::GoogleApi(format!("Backup update failed: {}", e))
            })?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            tracing::error!("Backup update failed with status {}: {}", status, error_text);
            return Err(AppError::GoogleApi(format!("Backup update failed ({}): {}", status, error_text)));
        }

        tracing::debug!("Backup file updated successfully");
        Ok(())
    }

    pub fn encrypt_backup_data(&self, data: &str, _encryption_key: &str) -> Result<String> {
        // For now, we'll use base64 encoding
        // In production, you should use proper encryption like AES
        let encoded = general_purpose::STANDARD.encode(data.as_bytes());
        Ok(encoded)
    }

    pub fn decrypt_backup_data(&self, encrypted_data: &str, _encryption_key: &str) -> Result<String> {
        // For now, we'll use base64 decoding
        // In production, you should use proper decryption like AES
        let decoded = general_purpose::STANDARD
            .decode(encrypted_data.as_bytes())
            .map_err(|e| AppError::GoogleApi(format!("Decryption failed: {}", e)))?;
        
        String::from_utf8(decoded)
            .map_err(|e| AppError::GoogleApi(format!("Invalid UTF-8 in backup: {}", e)))
    }
}
