ALTER TABLE assignment_dropbox_submissions
  ADD COLUMN viewed_at timestamptz,
  ADD COLUMN downloaded_at timestamptz;
CREATE INDEX assignment_dropbox_submissions_assignment_submitted_idx
  ON assignment_dropbox_submissions (assignment_id, submitted_at DESC);
