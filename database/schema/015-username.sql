-- 015-username.sql — Add username column (SQLite-compatible: no UNIQUE in ALTER)
-- First add column without constraint, then apply unique index separately
ALTER TABLE users ADD COLUMN username TEXT;

-- Add unique index for username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
