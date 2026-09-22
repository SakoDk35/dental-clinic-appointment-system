// server/src/modules/auth/auth.service.ts

import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import { signToken } from "../../utils/jwt";
import { AppError } from "../../middleware/errorHandler";
import { createPatient } from "../patients/patients.service";

interface LoginInput {
  email: string;
  password: string;
}

export async function loginUser({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // Same generic error whether the email doesn't exist, the password is
  // wrong, or the account has been deactivated — never reveal which case
  // it was, so no one can use this endpoint to probe which emails exist.
  if (!user || !user.isActive) {
    throw new AppError(401, "Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password.");
  }

  const token = signToken({ userId: user.id, role: user.role });

  // Strip the hash before this ever leaves the service — the API must
  // never return password hashes, per the approved API rules.
  const { passwordHash: _passwordHash, ...safeUser } = user;

  return { user: safeUser, token };
}

interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth?: string;
}

// Self-registration always creates a Patient — staff accounts (Admin,
// Receptionist, Dentist) are created by Admin, never through this route.
// Reuses the same creation logic patient management uses, so there is
// exactly one place a patient row actually gets created.
export async function registerPatient(input: RegisterInput) {
  return createPatient(input);
}
