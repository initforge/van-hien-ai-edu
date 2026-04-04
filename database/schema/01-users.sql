-- 01-users.sql — Users + Auth + Student Fields
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  role         TEXT NOT NULL CHECK(role IN ('student','teacher','admin')),
  avatar       TEXT,
  -- Auth fields
  username       TEXT,
  password_hash  TEXT,  -- PBKDF2: salt:hash
  -- Student fields
  gender         TEXT,
  birthdate      TEXT,  -- yyyy-mm-dd
  student_code   TEXT,  -- ma hoc sinh (Excel import)
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
