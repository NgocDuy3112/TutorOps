-- Sessions recorded before class-based tuition (0019) have class_id NULL,
-- so tuition/slip due queries (which bucket by class_id) never see them.
-- Backfill: sessions of students belonging to exactly one class inherit
-- that class. Ambiguous sessions (multi-class students) stay NULL and need
-- manual assignment via SQL.
UPDATE teaching_sessions AS ts
SET class_id = sub.class_id
FROM (
  SELECT ts2.id AS session_id, MIN(cs.class_id) AS class_id
  FROM teaching_sessions AS ts2
  JOIN class_students AS cs ON cs.student_id = ts2.student_id
  WHERE ts2.class_id IS NULL
    AND ts2.deleted_at IS NULL
  GROUP BY ts2.id
  HAVING COUNT(DISTINCT cs.class_id) = 1
) AS sub
WHERE ts.id = sub.session_id;
