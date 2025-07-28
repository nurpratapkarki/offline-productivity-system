# FocusFlow Setup Guide

This guide will help you set up the complete FocusFlow system with Rust backend, React frontend, and Google integration.

## Prerequisites

- **Rust** 1.77.2 or later
- **Node.js** 18 or later
- **PostgreSQL** 12 or later
- **Google Cloud Console** account

## Part 1: Google Cloud Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 2. Enable Required APIs

Enable these APIs in your Google Cloud project:
- Google+ API (for user info)
- Google Drive API (for backups)

```bash
# Using gcloud CLI (optional)
gcloud services enable plus.googleapis.com
gcloud services enable drive.googleapis.com
```

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback` (development)
   - Your production callback URL
5. Save the **Client ID** and **Client Secret**

### 4. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** (for testing) or **Internal** (for organization)
3. Fill in required fields:
   - App name: "FocusFlow"
   - User support email
   - Developer contact information
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/drive.file`

## Part 2: Database Setup

### 1. Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Windows - Download from postgresql.org
```

### 2. Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE focusflow;
CREATE USER focusflow_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE focusflow TO focusflow_user;
\q
```

## Part 3: Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install SQLx CLI

```bash
cargo install sqlx-cli --no-default-features --features postgres
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL=postgresql://focusflow_user:your_secure_password@localhost:5432/focusflow
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-long-and-random
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
FRONTEND_URL=http://localhost:5173
RUST_LOG=focusflow_backend=debug,tower_http=debug
```

### 4. Run Database Migrations

```bash
sqlx migrate run
```

### 5. Build and Run Backend

```bash
# Development
cargo run

# Production build
cargo build --release
./target/release/focusflow-backend
```

The backend will start on `http://localhost:3001`

## Part 4: Frontend Setup

### 1. Navigate to Project Root

```bash
cd ..  # Back to project root
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_APP_NAME=FocusFlow
VITE_APP_VERSION=1.0.0
```

### 4. Run Frontend

```bash
# Development
npm run dev

# Build for production
npm run build
```

The frontend will start on `http://localhost:5173`

## Part 5: Tauri Desktop App

### 1. Install Tauri CLI

```bash
npm install -g @tauri-apps/cli
```

### 2. Run Desktop App

```bash
# Development
npm run tauri:dev

# Build desktop app
npm run tauri:build
```

## Part 6: Testing the Setup

### 1. Test Backend Health

```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "service": "focusflow-backend",
  "version": "0.1.0"
}
```

### 2. Test Google OAuth

1. Open `http://localhost:5173` in your browser
2. Click "Continue with Google"
3. Complete OAuth flow
4. You should be redirected back to the app

### 3. Test API Endpoints

```bash
# Get auth URL
curl http://localhost:3001/auth/google

# Test protected endpoint (replace TOKEN with actual JWT)
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/notes
```

## Part 7: Production Deployment

### Backend Deployment

1. **Environment Variables**: Set production values
2. **Database**: Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
3. **HTTPS**: Configure SSL certificates
4. **Process Manager**: Use systemd, Docker, or similar
5. **Monitoring**: Set up logging and health checks

### Frontend Deployment

1. **Build**: `npm run build`
2. **Static Hosting**: Deploy `dist/` folder to Vercel, Netlify, etc.
3. **Environment**: Update API URLs for production
4. **CORS**: Configure backend CORS for your domain

### Desktop App Distribution

1. **Build**: `npm run tauri:build`
2. **Code Signing**: Sign executables for distribution
3. **Auto-updater**: Configure Tauri updater (optional)

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure user has correct permissions

2. **Google OAuth Errors**
   - Verify redirect URIs match exactly
   - Check OAuth consent screen configuration
   - Ensure APIs are enabled

3. **CORS Issues**
   - Check frontend URL in backend CORS config
   - Verify API_BASE_URL in frontend

4. **JWT Token Issues**
   - Ensure JWT_SECRET is set and consistent
   - Check token expiration (24 hours default)

### Logs and Debugging

```bash
# Backend logs
RUST_LOG=debug cargo run

# Frontend dev tools
# Open browser developer console

# Database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong database passwords
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Regular security updates
- [ ] Backup encryption keys management

## Next Steps

1. **Customize**: Modify the app for your specific needs
2. **Scale**: Add caching, load balancing as needed
3. **Monitor**: Set up application monitoring
4. **Backup**: Implement regular database backups
5. **Updates**: Plan for application updates and migrations

For support, check the README files in the backend and frontend directories, or refer to the API documentation.
