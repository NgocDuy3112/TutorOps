-- Tuition moves from per-student to per-class:
--   - payments gain class_id (new payments are recorded against a class)
--   - student_id becomes legacy: kept for existing rows, NULL for new ones
--   - students.default_price_vnd is dropped; the class price is the only
--     tuition source (per_session / per_hour / per_month all resolve via class)
ALTER TABLE payments
  ADD COLUMN class_id uuid REFERENCES classes (id) ON DELETE SET NULL;

CREATE INDEX payments_class_month_idx ON payments (class_id, applies_to_month);

-- Legacy payments recorded before class-based tuition keep their student_id.
ALTER TABLE payments
  ALTER COLUMN student_id DROP NOT NULL;

-- students_price_non_negative check is dropped together with its column.
ALTER TABLE students
  DROP COLUMN default_price_vnd;
