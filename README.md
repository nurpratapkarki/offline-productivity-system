# FocusFlow - Offline Productivity System

## Project Overview

A comprehensive productivity application with both offline-first capabilities and cloud synchronization. Built with a Rust backend, React frontend, and Tauri for desktop deployment.

### Architecture

- **Frontend**: React + TypeScript + Vite + Tauri
- **Backend**: Rust + Axum + PostgreSQL
- **Authentication**: Google OAuth 2.0
- **Sync**: Real-time bidirectional synchronization
- **Backup**: Encrypted Google Drive backups
- **Desktop**: Cross-platform Tauri application

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Rust 1.77.2+
- PostgreSQL 12+
- Google Cloud Console account

### Setup

1. **Complete Setup**: Follow the detailed [SETUP_GUIDE.md](./SETUP_GUIDE.md) for full configuration

2. **Quick Development Setup**:

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd offline-productivity-system

# Frontend setup
npm install
cp .env.example .env
npm run dev

# Backend setup (in another terminal)
cd backend
cp .env.example .env
# Configure your .env file with database and Google OAuth credentials
cargo run

# Desktop app (optional)
npm run tauri:dev
```

**Other Development Options**

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Features

### Core Productivity Features
- **📝 Smart Notes**: Markdown editor with encryption and tagging
- **✅ Task Management**: Kanban boards with priority and status tracking
- **🎯 Habit Tracking**: Build consistent habits with streak tracking
- **📊 Analytics Dashboard**: Visual insights into your productivity
- **🔍 Global Search**: Find anything across notes and tasks instantly

### Cloud & Sync Features
- **🔐 Google OAuth**: Secure authentication with Google accounts
- **☁️ Google Drive Backup**: Encrypted backups to your Google Drive
- **🔄 Real-time Sync**: Bidirectional synchronization across devices
- **⚡ Offline-First**: Full functionality without internet connection
- **🔒 End-to-End Encryption**: Client-side encryption for sensitive data

### Technical Features
- **🖥️ Desktop App**: Native desktop application via Tauri
- **📱 Responsive Design**: Works on all screen sizes
- **🌙 Focus Mode**: Distraction-free environment with Pomodoro timer
- **🎨 Modern UI**: Beautiful interface with shadcn/ui components

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Zustand** for state management
- **React Query** for server state

### Backend
- **Rust** with Axum web framework
- **PostgreSQL** for data persistence
- **SQLx** for database operations
- **OAuth2** for Google authentication
- **JWT** for session management

### Desktop
- **Tauri** for cross-platform desktop apps
- **Rust** backend integration
- **System integration** capabilities

## How to deploy this project

This project can be deployed to various platforms:

- **Vercel**: Connect your GitHub repository to Vercel for automatic deployments
- **Netlify**: Deploy directly from your Git repository
- **GitHub Pages**: Use GitHub Actions to build and deploy
- **Other platforms**: Any platform that supports static site hosting

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

### Desktop App
- `npm run tauri:dev` - Start Tauri development mode
- `npm run tauri:build` - Build desktop application
- `npm run desktop:build:linux` - Build for Linux
- `npm run desktop:build:windows` - Build for Windows

### Backend
- `cd backend && cargo run` - Start Rust backend server
- `cd backend && cargo build --release` - Build optimized backend
- `cd backend && sqlx migrate run` - Run database migrations

## Project Structure

```
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── pages/             # Application pages
│   ├── services/          # API and service layers
│   ├── stores/            # State management
│   └── lib/               # Utilities
├── src-tauri/             # Tauri desktop app
│   ├── src/               # Rust source for desktop
│   ├── icons/             # App icons
│   └── tauri.conf.json    # Tauri configuration
├── backend/               # Rust backend server
│   ├── src/               # Rust backend source
│   ├── migrations/        # Database migrations
│   └── Cargo.toml         # Rust dependencies
└── docs/                  # Documentation
```


