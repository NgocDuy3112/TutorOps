CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE oauth_accounts ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE students ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE access_tokens ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE teaching_sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE files ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE lessons ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE assignments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE student_assignments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE submissions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE payments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE push_subscriptions ALTER COLUMN id SET DEFAULT gen_random_uuid();
