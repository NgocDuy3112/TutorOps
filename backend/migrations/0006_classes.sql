CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name text NOT NULL,
  subject text,
  default_price_vnd bigint,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT classes_price_non_negative CHECK (default_price_vnd IS NULL OR default_price_vnd >= 0),
  CONSTRAINT classes_teacher_name_unique UNIQUE (teacher_id, name),
  CONSTRAINT classes_teacher_id_unique UNIQUE (teacher_id, id)
);

CREATE INDEX IF NOT EXISTS classes_teacher_active_idx
  ON classes (teacher_id)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS class_students (
  class_id uuid NOT NULL,
  student_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id),
  CONSTRAINT class_students_class_fk FOREIGN KEY (teacher_id, class_id)
    REFERENCES classes(teacher_id, id),
  CONSTRAINT class_students_student_fk FOREIGN KEY (teacher_id, student_id)
    REFERENCES students(teacher_id, id)
);

CREATE INDEX IF NOT EXISTS class_students_student_idx
  ON class_students (student_id);
