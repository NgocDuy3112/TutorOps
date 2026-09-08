-- Monthly summary slip ("phiếu tổng kết") for parents, exported as an image
-- by the teacher. Teacher writes a per-month comment per student; teacher
-- uploads a static bank-transfer QR image shown on the slip.
CREATE TABLE monthly_notes (
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month text NOT NULL,
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, month)
);

ALTER TABLE users
  ADD COLUMN payment_qr_file_id uuid REFERENCES files(id) ON DELETE SET NULL;
