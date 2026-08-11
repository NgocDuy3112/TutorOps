ALTER TABLE students ALTER COLUMN submission_mode SET DEFAULT 'self_submit';
UPDATE students SET submission_mode = 'self_submit' WHERE submission_mode = 'teacher_managed';
