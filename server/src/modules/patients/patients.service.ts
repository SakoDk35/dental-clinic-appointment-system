// server/src/modules/patients/patients.service.ts
//
// Every function here operates only on Users with role: PATIENT. This is
// enforced in the query itself (not just checked after the fact), so a
// Receptionist can never use these endpoints to read/create/edit a
// Dentist, Admin, or Receptionist account.

import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";

const SALT_ROUNDS = 10;

// Shape returned to the client — never includes passwordHash.
function toSafePatient<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export async function listPatients(search?: string) {
  const patients = await prisma.user.findMany({
    where: {
      role: "PATIENT",
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { fullName: "asc" },
  });

  return patients.map(toSafePatient);
}

export async function getPatientById(id: number) {
  const patient = await prisma.user.findFirst({ where: { id, role: "PATIENT" } });

  if (!patient) {
    throw new AppError(404, "Patient not found.");
  }

  return toSafePatient(patient);
}

interface CreatePatientInput {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth?: string;
}

export async function createPatient(input: CreatePatientInput) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const patient = await prisma.user.create({
    data: {
      fullName: input.fullName.trim(),
      email,
      passwordHash,
      phone: input.phone.trim(),
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      role: "PATIENT",
    },
  });

  return toSafePatient(patient);
}

interface UpdatePatientInput {
  fullName?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
}

// Shared by both "staff edits a patient" and "patient edits their own
// profile" — email/role/isActive are intentionally never accepted here.
export async function updatePatient(id: number, input: UpdatePatientInput) {
  const existing = await prisma.user.findFirst({ where: { id, role: "PATIENT" } });
  if (!existing) {
    throw new AppError(404, "Patient not found.");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(input.fullName !== undefined ? { fullName: input.fullName.trim() } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.dateOfBirth !== undefined
        ? { dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null }
        : {}),
    },
  });

  return toSafePatient(updated);
}

export async function setPatientActive(id: number, isActive: boolean) {
  const existing = await prisma.user.findFirst({ where: { id, role: "PATIENT" } });
  if (!existing) {
    throw new AppError(404, "Patient not found.");
  }

  const updated = await prisma.user.update({ where: { id }, data: { isActive } });
  return toSafePatient(updated);
}
