-- Class pricing modes + fixed weekly schedule with auto-generated sessions.
-- pricing_mode:
--   per_session (default, legacy): due = sum of session price_vnd
--   per_hour: default_price_vnd is the hourly rate; session price computed
--     from rate x duration (starts at taught_at, ends at ends_at)
--   per_month: default_price_vnd is a fixed monthly fee; charged once for any
--     month that has at least one session; session price_vnd = 0
ALTER TABLE classes
  ADD COLUMN pricing_mode text NOT NULL DEFAULT 'per_session',
  ADD COLUMN auto_schedule boolean NOT NULL DEFAULT false;

ALTER TABLE classes
  ADD CONSTRAINT classes_pricing_mode_check
  CHECK (pricing_mode IN ('per_session', 'per_hour', 'per_month'));

-- Sessions may belong to a class (needed for per-hour rate and per-month fee).
ALTER TABLE teaching_sessions
  ADD COLUMN class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  ADD COLUMN ends_at timestamptz;

-- Fixed weekly schedule slots (VN local wall-clock times).
CREATE TABLE class_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT class_schedules_time_order CHECK (end_time > start_time)
);

CREATE INDEX class_schedules_class_idx ON class_schedules (class_id);

-- One auto-generated session per class + student + slot occurrence.
-- Partial: soft-deleted rows free the slot so the generator can re-create it.
CREATE UNIQUE INDEX teaching_sessions_class_slot_unique
  ON teaching_sessions (class_id, student_id, taught_at)
  WHERE class_id IS NOT NULL AND deleted_at IS NULL;
