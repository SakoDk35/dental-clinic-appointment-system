ALTER TABLE "Appointment"
DROP CONSTRAINT "Appointment_no_active_overlap";

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_no_active_overlap"
EXCLUDE USING gist (
  "dentistId" WITH =,
  "appointmentDate" WITH =,
  int4range(
    clinic_time_minutes("startTime"),
    clinic_time_minutes("endTime"),
    '[)'
  ) WITH &&
)
WHERE ("status" <> 'CANCELLED');
