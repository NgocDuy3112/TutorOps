CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (teacher_id, id)
);

ALTER TABLE assignments
  ADD COLUMN lesson_id uuid;

ALTER TABLE assignments
  ADD CONSTRAINT assignments_lesson_owner_fk
  FOREIGN KEY (teacher_id, lesson_id)
  REFERENCES lessons (teacher_id, id)
  ON DELETE RESTRICT;

CREATE TABLE lesson_files (
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE RESTRICT,
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
  PRIMARY KEY (lesson_id, file_id)
);

CREATE TABLE session_lessons (
  teaching_session_id uuid NOT NULL REFERENCES teaching_sessions(id) ON DELETE RESTRICT,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE RESTRICT,
  PRIMARY KEY (teaching_session_id, lesson_id)
);

CREATE TABLE session_files (
  teaching_session_id uuid NOT NULL REFERENCES teaching_sessions(id) ON DELETE RESTRICT,
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
  PRIMARY KEY (teaching_session_id, file_id)
);

CREATE INDEX lessons_teacher_active_idx
  ON lessons (teacher_id)
  WHERE deleted_at IS NULL;

CREATE INDEX assignments_lesson_idx
  ON assignments (lesson_id);

CREATE INDEX session_lessons_lesson_idx
  ON session_lessons (lesson_id);

CREATE INDEX session_files_session_idx
  ON session_files (teaching_session_id);
