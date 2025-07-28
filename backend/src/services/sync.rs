use uuid::Uuid;
use chrono::Utc;

use crate::{
    database::Database,
    error::{AppError, Result},
    models::{
        ConflictInfo, EntityType, Note, Task, Habit, SyncAction, SyncItem, 
        SyncRequest, SyncResponse, SyncResult, SyncStatus
    },
};

pub struct SyncService {
    database: Database,
}

impl SyncService {
    pub fn new(database: Database) -> Self {
        Self { database }
    }

    pub async fn sync_user_data(
        &self,
        user_id: Uuid,
        request: SyncRequest,
    ) -> Result<SyncResponse> {
        let mut response = SyncResponse {
            notes: Vec::new(),
            tasks: Vec::new(),
            habits: Vec::new(),
            conflicts: Vec::new(),
        };

        // Sync notes
        for item in request.notes {
            match self.sync_note(user_id, item).await {
                Ok(result) => response.notes.push(result),
                Err(AppError::Conflict(msg)) => {
                    // Handle conflict
                    if let Ok(conflict) = self.create_note_conflict(user_id, &msg).await {
                        response.conflicts.push(conflict);
                    }
                }
                Err(e) => return Err(e),
            }
        }

        // Sync tasks
        for item in request.tasks {
            match self.sync_task(user_id, item).await {
                Ok(result) => response.tasks.push(result),
                Err(AppError::Conflict(msg)) => {
                    if let Ok(conflict) = self.create_task_conflict(user_id, &msg).await {
                        response.conflicts.push(conflict);
                    }
                }
                Err(e) => return Err(e),
            }
        }

        // Sync habits
        for item in request.habits {
            match self.sync_habit(user_id, item).await {
                Ok(result) => response.habits.push(result),
                Err(AppError::Conflict(msg)) => {
                    if let Ok(conflict) = self.create_habit_conflict(user_id, &msg).await {
                        response.conflicts.push(conflict);
                    }
                }
                Err(e) => return Err(e),
            }
        }

        // Update last sync time
        sqlx::query!(
            "UPDATE users SET last_sync_at = NOW() WHERE id = $1",
            user_id
        )
        .execute(self.database.pool())
        .await?;

        Ok(response)
    }

    async fn sync_note(&self, user_id: Uuid, item: SyncItem) -> Result<SyncResult> {
        if item.deleted {
            return self.delete_note_sync(user_id, item.id, item.version).await;
        }

        let data = item.data.ok_or_else(|| {
            AppError::Validation("Note data is required for non-delete operations".to_string())
        })?;

        // Check if note exists
        let existing = sqlx::query!(
            "SELECT version FROM notes WHERE id = $1 AND user_id = $2",
            item.id,
            user_id
        )
        .fetch_optional(self.database.pool())
        .await?;

        match existing {
            Some(existing_note) => {
                if existing_note.version == item.version {
                    // No changes needed
                    Ok(SyncResult {
                        id: item.id,
                        version: item.version,
                        action: SyncAction::NoChange,
                        data: None,
                    })
                } else if existing_note.version < item.version {
                    // Update from client
                    self.update_note_from_sync(user_id, item.id, &data, item.version).await
                } else {
                    // Conflict - server version is newer
                    Err(AppError::Conflict(format!("Note {} has conflicts", item.id)))
                }
            }
            None => {
                // Create new note
                self.create_note_from_sync(user_id, item.id, &data, item.version).await
            }
        }
    }

    async fn create_note_from_sync(
        &self,
        user_id: Uuid,
        note_id: Uuid,
        data: &serde_json::Value,
        version: i32,
    ) -> Result<SyncResult> {
        let title = data["title"].as_str().unwrap_or("Untitled");
        let content = data["content"].as_str().unwrap_or("");
        let tags: Vec<String> = data["tags"]
            .as_array()
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
            .unwrap_or_default();
        let is_encrypted = data["is_encrypted"].as_bool().unwrap_or(false);

        sqlx::query!(
            r#"
            INSERT INTO notes (id, user_id, title, content, tags, is_encrypted, version)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
            note_id,
            user_id,
            title,
            content,
            serde_json::to_value(&tags)?,
            is_encrypted,
            version
        )
        .execute(self.database.pool())
        .await?;

        Ok(SyncResult {
            id: note_id,
            version,
            action: SyncAction::Created,
            data: Some(data.clone()),
        })
    }

    async fn update_note_from_sync(
        &self,
        user_id: Uuid,
        note_id: Uuid,
        data: &serde_json::Value,
        version: i32,
    ) -> Result<SyncResult> {
        let title = data["title"].as_str().unwrap_or("Untitled");
        let content = data["content"].as_str().unwrap_or("");
        let tags: Vec<String> = data["tags"]
            .as_array()
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
            .unwrap_or_default();
        let is_encrypted = data["is_encrypted"].as_bool().unwrap_or(false);

        sqlx::query!(
            r#"
            UPDATE notes 
            SET title = $1, content = $2, tags = $3, is_encrypted = $4, 
                version = $5, updated_at = NOW()
            WHERE id = $6 AND user_id = $7
            "#,
            title,
            content,
            serde_json::to_value(&tags)?,
            is_encrypted,
            version,
            note_id,
            user_id
        )
        .execute(self.database.pool())
        .await?;

        Ok(SyncResult {
            id: note_id,
            version,
            action: SyncAction::Updated,
            data: Some(data.clone()),
        })
    }

    async fn delete_note_sync(
        &self,
        user_id: Uuid,
        note_id: Uuid,
        version: i32,
    ) -> Result<SyncResult> {
        sqlx::query!(
            "UPDATE notes SET deleted_at = NOW(), version = $1 WHERE id = $2 AND user_id = $3",
            version,
            note_id,
            user_id
        )
        .execute(self.database.pool())
        .await?;

        Ok(SyncResult {
            id: note_id,
            version,
            action: SyncAction::Deleted,
            data: None,
        })
    }

    // Similar implementations for tasks and habits would go here
    async fn sync_task(&self, user_id: Uuid, item: SyncItem) -> Result<SyncResult> {
        // Implementation similar to sync_note but for tasks
        // For brevity, returning a placeholder
        Ok(SyncResult {
            id: item.id,
            version: item.version,
            action: SyncAction::NoChange,
            data: None,
        })
    }

    async fn sync_habit(&self, user_id: Uuid, item: SyncItem) -> Result<SyncResult> {
        // Implementation similar to sync_note but for habits
        // For brevity, returning a placeholder
        Ok(SyncResult {
            id: item.id,
            version: item.version,
            action: SyncAction::NoChange,
            data: None,
        })
    }

    async fn create_note_conflict(&self, user_id: Uuid, _msg: &str) -> Result<ConflictInfo> {
        // Placeholder conflict creation
        Ok(ConflictInfo {
            entity_type: EntityType::Note,
            entity_id: Uuid::new_v4(),
            local_version: 1,
            server_version: 2,
            local_data: serde_json::json!({}),
            server_data: serde_json::json!({}),
        })
    }

    async fn create_task_conflict(&self, user_id: Uuid, _msg: &str) -> Result<ConflictInfo> {
        // Placeholder conflict creation
        Ok(ConflictInfo {
            entity_type: EntityType::Task,
            entity_id: Uuid::new_v4(),
            local_version: 1,
            server_version: 2,
            local_data: serde_json::json!({}),
            server_data: serde_json::json!({}),
        })
    }

    async fn create_habit_conflict(&self, user_id: Uuid, _msg: &str) -> Result<ConflictInfo> {
        // Placeholder conflict creation
        Ok(ConflictInfo {
            entity_type: EntityType::Habit,
            entity_id: Uuid::new_v4(),
            local_version: 1,
            server_version: 2,
            local_data: serde_json::json!({}),
            server_data: serde_json::json!({}),
        })
    }

    pub async fn get_sync_status(&self, user_id: Uuid) -> Result<Vec<SyncStatus>> {
        // Get sync status for all entities
        let mut statuses = Vec::new();

        // This is a simplified implementation
        // In a real app, you'd compare local and server versions
        
        Ok(statuses)
    }
}
