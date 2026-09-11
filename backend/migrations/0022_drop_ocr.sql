-- Drop the abandoned receipt-upload / OCR flow: the column set was never
-- written by any API (payments are created directly as 'confirmed').
ALTER TABLE payments
  DROP COLUMN IF EXISTS receipt_file_id,
  DROP COLUMN IF EXISTS ocr_detected_amount_vnd,
  DROP COLUMN IF EXISTS ocr_confidence,
  ALTER COLUMN status SET DEFAULT 'confirmed';
