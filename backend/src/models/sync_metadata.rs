use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "entity_type", rename_all = "lowercase")]
pub enum EntityType {
    Note,
    Task,
    Habit,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SyncMetadata {
    pub id: Uuid,
    pub user_id: Uuid,
    pub entity_type: EntityType,
    pub entity_id: Uuid,
    pub last_sync_version: i32,
    pub drive_file_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncStatus {
    pub entity_type: EntityType,
    pub entity_id: Uuid,
    pub local_version: i32,
    pub server_version: i32,
    pub needs_sync: bool,
    pub conflict: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncRequest {
    pub notes: Vec<SyncItem>,
    pub tasks: Vec<SyncItem>,
    pub habits: Vec<SyncItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncItem {
    pub id: Uuid,
    pub version: i32,
    pub deleted: bool,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncResponse {
    pub notes: Vec<SyncResult>,
    pub tasks: Vec<SyncResult>,
    pub habits: Vec<SyncResult>,
    pub conflicts: Vec<ConflictInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncResult {
    pub id: Uuid,
    pub version: i32,
    pub action: SyncAction,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum SyncAction {
    Created,
    Updated,
    Deleted,
    NoChange,
    Conflict,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConflictInfo {
    pub entity_type: EntityType,
    pub entity_id: Uuid,
    pub local_version: i32,
    pub server_version: i32,
    pub local_data: serde_json::Value,
    pub server_data: serde_json::Value,
}
