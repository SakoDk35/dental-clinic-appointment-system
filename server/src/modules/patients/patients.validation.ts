// server/src/modules/patients/patients.validation.ts
//
// Plain manual checks, same style as auth.controller.ts's inline
// validation — no schema-validation library needed for a form this small.

import { AppError } from "../../middleware/errorHandler";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

interface PatientInput {
  fullName?: unknown;
  email?: unknown;
  password?: unknown;
  phone?: unknown;
  dateOfBirth?: unknown;
}

// Used for both self-registration and staff-created patients. `password`
// is required for registration but not for staff edits, so callers pass
// requirePassword accordingly.
export function validatePatientInput(input: PatientInput, requirePassword: boolean) {
  const { fullName, email, password, phone, dateOfBirth } = input;

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

  if (dateOfBirth !== undefined && dateOfBirth !== null && typeof dateOfBirth !== "string") {
    throw new AppError(400, "Date of birth must be a date string.");
  }
}

// For self-profile and staff-edit updates: same field checks, but every
// field is optional since it's a partial update.
export function validatePatientUpdateInput(input: PatientInput) {
  const { fullName, phone, dateOfBirth } = input;

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

  if (dateOfBirth !== undefined && dateOfBirth !== null && typeof dateOfBirth !== "string") {
    throw new AppError(400, "Date of birth must be a date string.");
  }
}
