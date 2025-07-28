# FocusFlow Backend

A Rust backend server for the FocusFlow productivity application, providing Google OAuth authentication, data synchronization, and Google Drive backup capabilities.

## Features

- **Google OAuth 2.0 Authentication**: Secure login with Google accounts
- **RESTful API**: Full CRUD operations for notes, tasks, and habits
- **Data Synchronization**: Bidirectional sync with conflict resolution
- **Google Drive Integration**: Encrypted backup and restore functionality
- **JWT Token Management**: Secure session handling
- **PostgreSQL Database**: Robust data persistence with migrations
- **Version Control**: Optimistic locking for concurrent updates

## Technology Stack

- **Rust** with **Axum** web framework
- **SQLx** for database operations
- **PostgreSQL** for data storage
- **OAuth2** for Google authentication
- **JWT** for session management
- **Reqwest** for HTTP client operations

## Prerequisites

- Rust 1.77.2 or later
- PostgreSQL 12 or later
- Google Cloud Console project with OAuth 2.0 credentials

## Quick Start

The backend comes with sensible defaults for development. You can run it immediately:

```bash
cd backend
cargo run
```

The server will start on `http://localhost:3001` with:
- **Default JWT secret** (for development only)
- **Demo Google OAuth credentials** (authentication will work in demo mode)
- **PostgreSQL connection** to `postgresql://localhost/focusflow`

## Full Setup

### 1. Clone and Setup

```bash
cd backend
cp .env.example .env
```

### 2. Configure Environment Variables (Optional)

Edit `.env` file with your configuration:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/focusflow
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**Note**: All environment variables have defaults, so you can skip this step for development.

### 3. Database Setup

```bash
# Create database
createdb focusflow

# Install sqlx-cli if not already installed
cargo install sqlx-cli --no-default-features --features postgres

# Run migrations
sqlx migrate run
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Drive API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback` (development)
   - Your production callback URL

### 5. Run the Server

```bash
# Development
cargo run

# Production build
cargo build --release
./target/release/focusflow-backend
```

## API Endpoints

### Authentication

- `GET /auth/google` - Get Google OAuth URL
- `GET /auth/google/callback` - Handle OAuth callback
- `POST /auth/verify` - Verify JWT token

### Notes API

- `GET /api/notes` - List notes
- `POST /api/notes` - Create note
- `GET /api/notes/:id` - Get note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Tasks API

- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Habits API

- `GET /api/habits` - List habits
- `POST /api/habits` - Create habit
- `GET /api/habits/:id` - Get habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit

### Sync API

- `POST /api/sync` - Sync data
- `POST /api/sync/status` - Get sync status

### Backup API

- `POST /api/backup` - Create backup
- `POST /api/backup/list` - List backups
- `POST /api/backup/restore` - Restore backup
- `DELETE /api/backup/:file_id` - Delete backup

## Authentication

All API endpoints (except auth endpoints) require a Bearer token:

```
Authorization: Bearer <jwt_token>
```

## Data Synchronization

The sync system uses optimistic locking with version numbers:

1. Each entity has a version number that increments on updates
2. Clients send their version when updating
3. Server rejects updates if versions don't match
4. Conflicts are returned for manual resolution

## Google Drive Integration

Backups are stored in a dedicated "FocusFlow Backups" folder in the user's Google Drive:

- Backups are JSON files with user data
- Optional client-side encryption before upload
- Automatic backup naming with timestamps
- List, restore, and delete operations supported

## Development

### Running Tests

```bash
cargo test
```

### Database Migrations

```bash
# Create new migration
sqlx migrate add migration_name

# Run migrations
sqlx migrate run

# Revert last migration
sqlx migrate revert
```

### Logging

Set `RUST_LOG` environment variable for detailed logging:

```bash
RUST_LOG=focusflow_backend=debug,tower_http=debug cargo run
```

## Production Deployment

1. Set production environment variables
2. Use a production-grade PostgreSQL instance
3. Configure HTTPS with proper SSL certificates
4. Set up proper CORS for your frontend domain
5. Use a process manager like systemd or Docker
6. Configure proper logging and monitoring

## Security Considerations

- JWT tokens expire in 24 hours
- All sensitive data should be transmitted over HTTPS
- Database credentials should be properly secured
- Google OAuth secrets must be kept confidential
- Consider implementing rate limiting for production
- Backup encryption keys should be managed securely

## License

This project is part of the FocusFlow productivity system.
