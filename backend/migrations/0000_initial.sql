CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('teacher', 'admin');
CREATE TYPE submission_mode AS ENUM ('teacher_managed', 'self_submit');
CREATE TYPE access_token_type AS ENUM ('student', 'parent');
CREATE TYPE payment_status AS ENUM ('draft', 'needs_confirmation', 'confirmed', 'rejected');
CREATE TYPE student_assignment_status AS ENUM ('pending', 'submitted', 'reviewed', 'rejected');
CREATE TYPE submitted_by AS ENUM ('teacher', 'student');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text,
  role user_role NOT NULL DEFAULT 'teacher',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE oauth_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  provider text NOT NULL DEFAULT 'google',
  provider_account_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_id)
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  token_hash text NOT NULL UNIQUE,
  remember_me boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  user_agent text,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name text NOT NULL,
  parent_name text,
  parent_phone text,
  default_price_vnd bigint NOT NULL DEFAULT 0 CHECK (default_price_vnd >= 0),
  submission_mode submission_mode NOT NULL DEFAULT 'teacher_managed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (teacher_id, id)
);

CREATE TABLE access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  token_type access_token_type NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE teaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  taught_at timestamptz NOT NULL,
  price_vnd bigint NOT NULL CHECK (price_vnd >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key text NOT NULL UNIQUE,
  original_name text,
  mime_type text NOT NULL,
  extension text,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 20971520),
  checksum text,
  created_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (teacher_id, id)
);

CREATE TABLE student_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  status student_assignment_status NOT NULL DEFAULT 'pending',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id),
  FOREIGN KEY (teacher_id, assignment_id) REFERENCES assignments(teacher_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (teacher_id, student_id) REFERENCES students(teacher_id, id) ON DELETE RESTRICT
);

CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_assignment_id uuid NOT NULL REFERENCES student_assignments(id) ON DELETE RESTRICT,
  submitted_by submitted_by NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  attempt_no integer NOT NULL CHECK (attempt_no > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_assignment_id, attempt_no)
);

CREATE TABLE assignment_files (
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE RESTRICT,
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
  PRIMARY KEY (assignment_id, file_id)
);

CREATE TABLE submission_files (
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE RESTRICT,
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
  PRIMARY KEY (submission_id, file_id)
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  amount_vnd bigint NOT NULL CHECK (amount_vnd > 0),
  paid_at timestamptz NOT NULL,
  status payment_status NOT NULL DEFAULT 'draft',
  receipt_file_id uuid REFERENCES files(id) ON DELETE RESTRICT,
  ocr_detected_amount_vnd bigint CHECK (ocr_detected_amount_vnd IS NULL OR ocr_detected_amount_vnd > 0),
  ocr_confidence numeric CHECK (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 1)),
  confirmed_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  confirmed_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX students_teacher_active_idx ON students (teacher_id) WHERE deleted_at IS NULL;
CREATE INDEX teaching_sessions_student_taught_idx ON teaching_sessions (student_id, taught_at);
CREATE INDEX payments_student_paid_idx ON payments (student_id, paid_at);
CREATE INDEX assignments_teacher_active_idx ON assignments (teacher_id) WHERE deleted_at IS NULL;
CREATE INDEX student_assignments_student_status_idx ON student_assignments (student_id, status);
CREATE INDEX submissions_assignment_submitted_idx ON submissions (student_assignment_id, submitted_at);
CREATE INDEX access_tokens_student_type_idx ON access_tokens (student_id, token_type);
CREATE INDEX sessions_user_expires_idx ON sessions (user_id, expires_at);
