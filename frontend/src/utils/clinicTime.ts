export const CLINIC_TIME_ZONE = "Asia/Yerevan";

const clinicDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLINIC_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const clinicDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLINIC_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function getClinicToday(now = new Date()): string {
  const parts = Object.fromEntries(
    clinicDateFormatter
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function shiftDate(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function hasClinicDateTimePassed(date: string, time: string, now = new Date()): boolean {
  const parts = Object.fromEntries(
    clinicDateTimeFormatter
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  const clinicNow = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  return `${date}T${time}` <= clinicNow;
}
