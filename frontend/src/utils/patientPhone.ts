import { VALIDATION_LIMITS } from "./validationLimits";

export const PATIENT_PHONE_ERROR = "Enter a valid phone number (8–15 digits).";

export function isValidPatientPhone(phone: string): boolean {
  const digitCount = phone.replace(/[^0-9]/g, "").length;
  return phone.length <= VALIDATION_LIMITS.phone
    && /^[0-9+ ()-]+$/.test(phone)
    && digitCount >= 8
    && digitCount <= 15;
}
