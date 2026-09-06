-- Where a class is taught: home (tutor's/student's home), center (learning
-- center), online. Nullable: legacy classes have no venue set.
ALTER TABLE classes
  ADD COLUMN venue text;

ALTER TABLE classes
  ADD CONSTRAINT classes_venue_check
  CHECK (venue IN ('home', 'center', 'online'));
