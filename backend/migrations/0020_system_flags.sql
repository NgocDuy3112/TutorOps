-- Update notices: key/value flags for one-shot system events.
-- 'announced_version' records the last APP_VERSION that was broadcast to
-- push subscribers, so a new deploy announces itself exactly once.
CREATE TABLE system_flags (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
