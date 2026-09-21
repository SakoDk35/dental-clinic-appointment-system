CREATE TABLE "DentistTimeOff" (
  "id" SERIAL NOT NULL,
  "dentistId" INTEGER NOT NULL,
  "date" DATE NOT NULL,
  "startTime" TEXT,
  "endTime" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DentistTimeOff_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DentistTimeOff_valid_period" CHECK (
    ("startTime" IS NULL AND "endTime" IS NULL)
    OR
    ("startTime" IS NOT NULL AND "endTime" IS NOT NULL AND "startTime" < "endTime")
  )
);

CREATE INDEX "DentistTimeOff_dentistId_date_idx"
ON "DentistTimeOff"("dentistId", "date");

ALTER TABLE "DentistTimeOff"
ADD CONSTRAINT "DentistTimeOff_dentistId_fkey"
FOREIGN KEY ("dentistId") REFERENCES "Dentist"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
