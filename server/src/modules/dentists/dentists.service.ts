// server/src/modules/dentists/dentists.service.ts

import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import type { WorkingHoursInputRow } from "./dentists.validation";

const SALT_ROUNDS = 10;

// Shapes the combined User+Dentist row into the flat shape the frontend
// expects (matches the approved `Dentist` type: id, userId, fullName,
// specialty, isActive, phone, email, workingHours).
function toDentistDto(dentist: {
  id: number;
  userId: number;
  specialty: string | null;
  workingHours?: { id: number; dayOfWeek: number; startTime: string; endTime: string }[];
  user: { fullName: string; email: string; phone: string | null; isActive: boolean };
}) {
  return {
    id: dentist.id,
    userId: dentist.userId,
    fullName: dentist.user.fullName,
    email: dentist.user.email,
    phone: dentist.user.phone,
    specialty: dentist.specialty,
    isActive: dentist.user.isActive,
    workingHours: dentist.workingHours ?? [],
  };
}

const DENTIST_INCLUDE = { user: true, workingHours: true } as const;

export async function listDentists(activeOnly: boolean) {
  const dentists = await prisma.dentist.findMany({
    where: activeOnly ? { user: { isActive: true } } : undefined,
    include: DENTIST_INCLUDE,
    orderBy: { user: { fullName: "asc" } },
  });
  return dentists.map(toDentistDto);
}

export async function getDentistById(id: number) {
  const dentist = await prisma.dentist.findUnique({ where: { id }, include: DENTIST_INCLUDE });
  if (!dentist) {
    throw new AppError(404, "Dentist not found.");
  }
  return toDentistDto(dentist);
}

interface CreateDentistInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  specialty?: string;
}

// Creates the User and Dentist rows together in one transaction, since a
// dentist account only makes sense with both parts present.
export async function createDentist(input: CreateDentistInput) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const dentist = await prisma.dentist.create({
    data: {
      specialty: input.specialty ?? null,
      user: {
        create: {
          fullName: input.fullName.trim(),
          email,
          passwordHash,
          phone: input.phone ?? null,
          role: "DENTIST",
        },
      },
    },
    include: DENTIST_INCLUDE,
  });

  return toDentistDto(dentist);
}

interface UpdateDentistInput {
  fullName?: string;
  phone?: string | null;
  specialty?: string | null;
}

export async function updateDentist(id: number, input: UpdateDentistInput) {
  const existing = await prisma.dentist.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Dentist not found.");
  }

  const dentist = await prisma.dentist.update({
    where: { id },
    data: {
      ...(input.specialty !== undefined ? { specialty: input.specialty } : {}),
      user: {
        update: {
          ...(input.fullName !== undefined ? { fullName: input.fullName.trim() } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
        },
      },
    },
    include: DENTIST_INCLUDE,
  });

  return toDentistDto(dentist);
}

export async function setDentistActive(id: number, isActive: boolean) {
  const existing = await prisma.dentist.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Dentist not found.");
  }

  const dentist = await prisma.dentist.update({
    where: { id },
    data: { user: { update: { isActive } } },
    include: DENTIST_INCLUDE,
  });

  return toDentistDto(dentist);
}

// Always replaces the full week in one call — simplest correct approach
// for a "recurring weekly pattern, no per-day overrides" requirement.
export async function setWorkingHours(dentistId: number, rows: WorkingHoursInputRow[]) {
  const existing = await prisma.dentist.findUnique({ where: { id: dentistId } });
  if (!existing) {
    throw new AppError(404, "Dentist not found.");
  }

  await prisma.$transaction([
    prisma.workingHours.deleteMany({ where: { dentistId } }),
    prisma.workingHours.createMany({
      data: rows.map((row) => ({ dentistId, ...row })),
    }),
  ]);

  return getDentistById(dentistId);
}
