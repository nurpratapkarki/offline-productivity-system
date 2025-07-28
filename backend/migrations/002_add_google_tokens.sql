-- Add Google OAuth token storage to users table
ALTER TABLE users 
ADD COLUMN google_access_token VARCHAR,
ADD COLUMN google_refresh_token VARCHAR,
ADD COLUMN google_token_expires_at TIMESTAMPTZ;

-- Add index for token lookups
CREATE INDEX idx_users_google_access_token ON users(google_access_token);
