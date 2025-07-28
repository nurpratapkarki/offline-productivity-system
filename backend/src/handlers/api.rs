use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};

use crate::{middleware::auth_middleware, AppState};

pub mod notes;
pub mod tasks;
pub mod habits;
pub mod sync;
pub mod backup;

pub fn routes() -> Router<AppState> {
    Router::new()
        .nest("/notes", notes::routes())
        .nest("/tasks", tasks::routes())
        .nest("/habits", habits::routes())
        .nest("/sync", sync::routes())
        .nest("/backup", backup::routes())
}
