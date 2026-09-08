ALTER TABLE classes DROP CONSTRAINT classes_teacher_name_unique;

CREATE UNIQUE INDEX classes_teacher_name_active_unique
  ON classes (teacher_id, name)
  WHERE deleted_at IS NULL;
