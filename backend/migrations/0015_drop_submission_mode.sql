-- Retire per-student submission mode: students/parents now upload work through
-- the teacher-sent submission link (assignment dropbox), so the toggle is dead.
ALTER TABLE students
  DROP COLUMN submission_mode;

DROP TYPE IF EXISTS submission_mode;
