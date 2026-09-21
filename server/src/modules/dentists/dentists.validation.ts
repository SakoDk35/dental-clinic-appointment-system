// server/src/modules/dentists/dentists.validation.ts

import { AppError } from "../../middleware/errorHandler";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";
import { getClinicDateTimeParts } from "../../utils/clinicTime";
import { isValidCalendarDate } from "../appointments/appointments.validation";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/; // "HH:mm", 24-hour

interface DentistInput {
  fullName?: unknown;
  email?: unknown;
  password?: unknown;
  phone?: unknown;
  specialty?: unknown;
}

export function validateDentistInput(input: DentistInput, requirePassword: boolean) {
  const { fullName, email, password, phone, specialty } = input;

  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    throw new AppError(400, "Full name is required.");
  }
  if (fullName.length > VALIDATION_LIMITS.fullName) {
    throw new AppError(400, `Full name must be ${VALIDATION_LIMITS.fullName} characters or fewer.`);
  }

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw new AppError(400, "A valid email address is required.");
  }
  if (email.length > VALIDATION_LIMITS.email) {
    throw new AppError(400, `Email must be ${VALIDATION_LIMITS.email} characters or fewer.`);
  }

  if (requirePassword) {
    if (!password || typeof password !== "string" || password.length < 8) {
      throw new AppError(400, "Password must be at least 8 characters.");
    }
    if (password.length > VALIDATION_LIMITS.password) {
      throw new AppError(400, `Password must be ${VALIDATION_LIMITS.password} characters or fewer.`);
    }
  }

  if (phone !== undefined && phone !== null && typeof phone !== "string") {
    throw new AppError(400, "Phone must be text.");
  }
  if (typeof phone === "string" && phone.length > VALIDATION_LIMITS.phone) {
    throw new AppError(400, `Phone must be ${VALIDATION_LIMITS.phone} characters or fewer.`);
  }

  if (specialty !== undefined && specialty !== null && typeof specialty !== "string") {
    throw new AppError(400, "Specialty must be text.");
  }
  if (typeof specialty === "string" && specialty.length > VALIDATION_LIMITS.specialty) {
    throw new AppError(400, `Specialty must be ${VALIDATION_LIMITS.specialty} characters or fewer.`);
  }
}

export function validateDentistUpdateInput(input: DentistInput) {
  const { fullName, phone, specialty } = input;

  if (fullName !== undefined && (typeof fullName !== "string" || !fullName.trim())) {
    throw new AppError(400, "Full name cannot be empty.");
  }
  if (typeof fullName === "string" && fullName.length > VALIDATION_LIMITS.fullName) {
    throw new AppError(400, `Full name must be ${VALIDATION_LIMITS.fullName} characters or fewer.`);
  }
  if (phone !== undefined && phone !== null && typeof phone !== "string") {
    throw new AppError(400, "Phone must be text.");
  }
  if (typeof phone === "string" && phone.length > VALIDATION_LIMITS.phone) {
    throw new AppError(400, `Phone must be ${VALIDATION_LIMITS.phone} characters or fewer.`);
  }
  if (specialty !== undefined && specialty !== null && typeof specialty !== "string") {
    throw new AppError(400, "Specialty must be text.");
  }
  if (typeof specialty === "string" && specialty.length > VALIDATION_LIMITS.specialty) {
    throw new AppError(400, `Specialty must be ${VALIDATION_LIMITS.specialty} characters or fewer.`);
  }
}

export interface WorkingHoursInputRow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

// Validates the whole weekly array in one go — this always replaces the
// full week, so partial/day-by-day updates are intentionally not supported.
export function validateWorkingHoursInput(rows: unknown): WorkingHoursInputRow[] {
  if (!Array.isArray(rows)) {
    throw new AppError(400, "workingHours must be an array.");
  }

  const seenDays = new Set<number>();

  for (const row of rows) {
    if (typeof row !== "object" || row === null) {
      throw new AppError(400, "Each working hours entry must be an object.");
    }
    const { dayOfWeek, startTime, endTime } = row as Record<string, unknown>;

    if (typeof dayOfWeek !== "number" || dayOfWeek < 0 || dayOfWeek > 6 || !Number.isInteger(dayOfWeek)) {
      throw new AppError(400, "dayOfWeek must be an integer from 0 (Sunday) to 6 (Saturday).");
    }
    if (seenDays.has(dayOfWeek)) {
      throw new AppError(400, `Duplicate entry for dayOfWeek ${dayOfWeek}.`);
    }
    seenDays.add(dayOfWeek);

    if (typeof startTime !== "string" || !TIME_REGEX.test(startTime)) {
      throw new AppError(400, "startTime must be in HH:mm format.");
    }
    if (typeof endTime !== "string" || !TIME_REGEX.test(endTime)) {
      throw new AppError(400, "endTime must be in HH:mm format.");
    }
    if (startTime >= endTime) {
      throw new AppError(400, "startTime must be before endTime.");
    }
  }

  return rows as WorkingHoursInputRow[];
}

export interface DentistTimeOffInput {
  date: string;
  startTime: string | null;
  endTime: string | null;
}

export function validateDentistTimeOffInput(input: {
  date?: unknown;
  fullDay?: unknown;
  startTime?: unknown;
  endTime?: unknown;
}): DentistTimeOffInput {
  if (typeof input.date !== "string" || !isValidCalendarDate(input.date)) {
    throw new AppError(400, "date must be a valid date in YYYY-MM-DD format.");
  }
  if (input.date < getClinicDateTimeParts().date) {
    throw new AppError(400, "Time-off cannot be created in the past.");
  }
  if (typeof input.fullDay !== "boolean") {
    throw new AppError(400, "fullDay must be true or false.");
  }
  if (input.fullDay) {
    return { date: input.date, startTime: null, endTime: null };
  }
  if (typeof input.startTime !== "string" || !TIME_REGEX.test(input.startTime)) {
    throw new AppError(400, "startTime must be in HH:mm format.");
  }
  if (typeof input.endTime !== "string" || !TIME_REGEX.test(input.endTime)) {
    throw new AppError(400, "endTime must be in HH:mm format.");
  }
  if (input.startTime >= input.endTime) {
    throw new AppError(400, "startTime must be before endTime.");
  }
  return { date: input.date, startTime: input.startTime, endTime: input.endTime };
}
