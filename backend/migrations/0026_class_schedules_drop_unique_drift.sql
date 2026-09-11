-- class_schedules must have NO unique index besides its PK: replaceSchedules
-- does DELETE-first + plain INSERT, so a unique index on anything (e.g. a
-- drift index on (class_id, teacher_id, start_time, end_time) without
-- weekday) silently rejects legitimate slots — two slots sharing the same
-- time on different weekdays would collapse to one with a 200 response.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'class_schedules'
      AND indexname NOT IN ('class_schedules_pkey', 'class_schedules_class_idx')
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', r.indexname);
  END LOOP;
END $$;
