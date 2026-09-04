-- Option B: a payment records when money was received (paid_at, auto "now"),
-- but the tuition month it settles is explicit (applies_to_month).
ALTER TABLE payments
  ADD COLUMN applies_to_month text;

-- Backfill: legacy payments settle the month they were received (VN local time).
UPDATE payments
SET applies_to_month = to_char(paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM');

ALTER TABLE payments
  ALTER COLUMN applies_to_month SET NOT NULL,
  ADD CONSTRAINT payments_applies_to_month_format
    CHECK (applies_to_month ~ '^\d{4}-(0[1-9]|1[0-2])$');

CREATE INDEX payments_applies_to_month_idx
  ON payments (student_id, applies_to_month);
