ALTER TABLE assignment_dropbox_submissions
  ADD COLUMN student_id uuid REFERENCES students(id) ON DELETE RESTRICT,
  ADD COLUMN score numeric(4,2),
  ADD COLUMN review_note text,
  ADD COLUMN reviewed_at timestamptz,
  ADD CONSTRAINT assignment_dropbox_submissions_score_range_check
    CHECK (score IS NULL OR (score >= 0 AND score <= 10));

CREATE INDEX assignment_dropbox_submissions_student_reviewed_idx
  ON assignment_dropbox_submissions (student_id, reviewed_at DESC)
  WHERE student_id IS NOT NULL;
