-- Venue ("Nơi dạy") feature removed: the UI no longer edits or displays it.
ALTER TABLE classes
  DROP CONSTRAINT IF EXISTS classes_venue_check,
  DROP COLUMN IF EXISTS venue;
