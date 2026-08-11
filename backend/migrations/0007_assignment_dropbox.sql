CREATE TABLE assignment_submission_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE RESTRICT,
  token_hash text NOT NULL UNIQUE,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assignment_submission_links_assignment_active_idx ON assignment_submission_links (assignment_id) WHERE revoked_at IS NULL;

CREATE TABLE assignment_dropbox_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE RESTRICT,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE assignment_dropbox_submission_files (
  submission_id uuid NOT NULL REFERENCES assignment_dropbox_submissions(id) ON DELETE RESTRICT,
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
  PRIMARY KEY (submission_id, file_id)
);
