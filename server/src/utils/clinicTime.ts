export const CLINIC_TIME_ZONE = "Asia/Yerevan";

interface ClinicDateTimeParts {
  date: string;
  time: string;
  minutes: number;
}

const clinicDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLINIC_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function getClinicDateTimeParts(now = new Date()): ClinicDateTimeParts {
  const parts = Object.fromEntries(
    clinicDateTimeFormatter
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}`;
  return {
    date,
    time,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export function isClinicDateTimeInPast(date: string, time: string, now = new Date()): boolean {
  const clinicNow = getClinicDateTimeParts(now);
  return `${date}T${time}` < `${clinicNow.date}T${clinicNow.time}`;
}
