use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Habit {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub color: String,
    pub streak: i32,
    pub completed_dates: JsonValue,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub version: i32,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateHabitRequest {
    pub name: String,
    pub color: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateHabitRequest {
    pub name: Option<String>,
    pub color: Option<String>,
    pub streak: Option<i32>,
    pub completed_dates: Option<Vec<String>>,
    pub version: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HabitResponse {
    pub id: Uuid,
    pub name: String,
    pub color: String,
    pub streak: i32,
    pub completed_dates: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub version: i32,
}

impl From<Habit> for HabitResponse {
    fn from(habit: Habit) -> Self {
        let completed_dates = serde_json::from_value(habit.completed_dates).unwrap_or_default();
        HabitResponse {
            id: habit.id,
            name: habit.name,
            color: habit.color,
            streak: habit.streak,
            completed_dates,
            created_at: habit.created_at,
            updated_at: habit.updated_at,
            version: habit.version,
        }
    }
}
