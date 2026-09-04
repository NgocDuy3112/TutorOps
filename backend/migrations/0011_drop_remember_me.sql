-- Remove remember_me column from sessions table (no longer used)
ALTER TABLE sessions DROP COLUMN IF EXISTS remember_me;
