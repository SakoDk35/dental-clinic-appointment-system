-- Existing cancelled appointments are not collectible debt. There were no
-- PAID cancelled appointments when this migration was prepared; those would
-- intentionally remain untouched rather than inventing refund accounting.
UPDATE "Payment" AS payment
SET "status" = 'VOID',
    "updatedAt" = CURRENT_TIMESTAMP
FROM "Appointment" AS appointment
WHERE payment."appointmentId" = appointment."id"
  AND appointment."status" = 'CANCELLED'
  AND payment."status" = 'UNPAID';
