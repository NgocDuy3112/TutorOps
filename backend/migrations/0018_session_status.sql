-- Teaching session status lifecycle:
--   unconfirmed: created (manually or auto-generated), not yet ticked
--   taught:      teacher ticked "Đã dạy"
--   cancelled:   teacher ticked "Không dạy" — excluded from tuition due
ALTER TABLE teaching_sessions
  ADD COLUMN status text NOT NULL DEFAULT 'unconfirmed';

ALTER TABLE teaching_sessions
  ADD CONSTRAINT teaching_sessions_status_check
  CHECK (status IN ('unconfirmed', 'taught', 'cancelled'));
