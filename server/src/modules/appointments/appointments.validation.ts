// server/src/modules/appointments/appointments.validation.ts

import { AppError } from "../../middleware/errorHandler";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

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
