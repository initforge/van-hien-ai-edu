-- 018-password.sql
-- Add password_hash column for auth

ALTER TABLE users ADD COLUMN password_hash TEXT;
