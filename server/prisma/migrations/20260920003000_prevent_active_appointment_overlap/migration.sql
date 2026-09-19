-- PostgreSQL exclusion constraints provide the final concurrency-safe guard
-- against overlapping active appointments. The half-open range means an
-- appointment ending at 11:00 does not conflict with one starting at 11:00.
-- Cancelled appointments are intentionally excluded so their slots can be
-- booked again.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE FUNCTION clinic_time_minutes(value text)
RETURNS integer
LANGUAGE SQL
IMMUTABLE
STRICT
AS $$
  SELECT split_part(value, ':', 1)::integer * 60
       + split_part(value, ':', 2)::integer
$$;

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_no_active_overlap"
EXCLUDE USING gist (
  "dentistId" WITH =,
  int4range(
    clinic_time_minutes("startTime"),
    clinic_time_minutes("endTime"),
    '[)'
  ) WITH &&
)
WHERE ("status" <> 'CANCELLED');
