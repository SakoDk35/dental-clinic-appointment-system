// server/src/modules/appointments/appointments.validation.ts

import { AppError } from "../../middleware/errorHandler";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const APPOINTMENT_STATUSES = ["BOOKED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

export function isValidCalendarDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

interface CreateAppointmentInput {
  patientId?: unknown;
  dentistId?: unknown;
  serviceId?: unknown;
  appointmentDate?: unknown;
  startTime?: unknown;
}

export function validateCreateAppointmentInput(input: CreateAppointmentInput) {
  const { dentistId, serviceId, appointmentDate, startTime } = input;

  if (typeof dentistId !== "number" || !Number.isInteger(dentistId)) {
    throw new AppError(400, "dentistId is required.");
  }
  if (typeof serviceId !== "number" || !Number.isInteger(serviceId)) {
    throw new AppError(400, "serviceId is required.");
  }
  if (typeof appointmentDate !== "string" || !isValidCalendarDate(appointmentDate)) {
    throw new AppError(400, "appointmentDate must be a valid date in YYYY-MM-DD format.");
  }
  if (typeof startTime !== "string" || !TIME_REGEX.test(startTime)) {
    throw new AppError(400, "startTime must be in HH:mm format.");
  }
}

interface RescheduleInput {
  dentistId?: unknown;
  appointmentDate?: unknown;
  startTime?: unknown;
}

export function validateRescheduleInput(input: RescheduleInput) {
  const { dentistId, appointmentDate, startTime } = input;

  if (dentistId !== undefined && (typeof dentistId !== "number" || !Number.isInteger(dentistId))) {
    throw new AppError(400, "dentistId must be a number.");
  }
  if (appointmentDate !== undefined && (typeof appointmentDate !== "string" || !isValidCalendarDate(appointmentDate))) {
    throw new AppError(400, "appointmentDate must be a valid date in YYYY-MM-DD format.");
  }
  if (startTime !== undefined && (typeof startTime !== "string" || !TIME_REGEX.test(startTime))) {
    throw new AppError(400, "startTime must be in HH:mm format.");
  }
}

export function validateAvailableSlotsQuery(dateParam: unknown, serviceIdParam: unknown) {
  if (typeof dateParam !== "string" || !isValidCalendarDate(dateParam)) {
    throw new AppError(400, "date query parameter must be a valid date in YYYY-MM-DD format.");
  }
  const serviceId = Number(serviceIdParam);
  if (!Number.isInteger(serviceId)) {
    throw new AppError(400, "serviceId query parameter is required.");
  }
  return { date: dateParam, serviceId };
}

export function validateListAppointmentsQuery(input: {
  date?: unknown;
  status?: unknown;
  search?: unknown;
}) {
  if (input.date !== undefined && (typeof input.date !== "string" || !isValidCalendarDate(input.date))) {
    throw new AppError(400, "date query parameter must be a valid date in YYYY-MM-DD format.");
  }

  if (
    input.status !== undefined &&
    (typeof input.status !== "string" || !APPOINTMENT_STATUSES.includes(input.status as typeof APPOINTMENT_STATUSES[number]))
  ) {
    throw new AppError(400, "status must be BOOKED, CONFIRMED, COMPLETED, or CANCELLED.");
  }

  if (input.search !== undefined && typeof input.search !== "string") {
    throw new AppError(400, "search must be text.");
  }
  const search = typeof input.search === "string" ? input.search.trim() : undefined;
  if (search && search.length > 100) {
    throw new AppError(400, "search must be 100 characters or fewer.");
  }

  return {
    date: input.date as string | undefined,
    status: input.status as typeof APPOINTMENT_STATUSES[number] | undefined,
    search: search || undefined,
  };
}
