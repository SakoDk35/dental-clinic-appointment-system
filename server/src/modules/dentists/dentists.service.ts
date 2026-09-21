// server/src/modules/dentists/dentists.service.ts

import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import type { DentistTimeOffInput, WorkingHoursInputRow } from "./dentists.validation";

const SALT_ROUNDS = 10;

function dateStrToUtcDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function intervalsOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

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

function toTimeOffDto(timeOff: {
  id: number;
  dentistId: number;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  createdAt: Date;
}) {
  return {
    ...timeOff,
    date: formatDate(timeOff.date),
    fullDay: timeOff.startTime === null,
  };
}

export async function listDentistTimeOff(dentistId: number) {
  const existing = await prisma.dentist.findUnique({ where: { id: dentistId } });
  if (!existing) throw new AppError(404, "Dentist not found.");

  const rows = await prisma.dentistTimeOff.findMany({
    where: { dentistId },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return rows.map(toTimeOffDto);
}

export async function getDentistTimeOffIntervals(dentistId: number, date: string) {
  const rows = await prisma.dentistTimeOff.findMany({
    where: { dentistId, date: dateStrToUtcDate(date) },
    select: { startTime: true, endTime: true },
  });
  return rows.map((row) => ({
    start: row.startTime === null ? 0 : timeToMinutes(row.startTime),
    end: row.endTime === null ? 24 * 60 : timeToMinutes(row.endTime),
  }));
}

export async function assertNoDentistTimeOffConflict(
  dentistId: number,
  date: string,
  startMinutes: number,
  endMinutes: number
) {
  const blocked = await getDentistTimeOffIntervals(dentistId, date);
  if (blocked.some((period) => intervalsOverlap(startMinutes, endMinutes, period.start, period.end))) {
    throw new AppError(409, "The dentist is unavailable during the selected time.");
  }
}

export async function createDentistTimeOff(dentistId: number, input: DentistTimeOffInput) {
  const existingDentist = await prisma.dentist.findUnique({ where: { id: dentistId } });
  if (!existingDentist) throw new AppError(404, "Dentist not found.");

  const newStart = input.startTime === null ? 0 : timeToMinutes(input.startTime);
  const newEnd = input.endTime === null ? 24 * 60 : timeToMinutes(input.endTime);
  const date = dateStrToUtcDate(input.date);

  const [existingTimeOff, appointments] = await Promise.all([
    prisma.dentistTimeOff.findMany({
      where: { dentistId, date },
      select: { startTime: true, endTime: true },
    }),
    prisma.appointment.findMany({
      where: { dentistId, appointmentDate: date, status: { not: "CANCELLED" } },
      select: { startTime: true, endTime: true },
    }),
  ]);

  const duplicatesBlockedPeriod = existingTimeOff.some((row) => {
    const start = row.startTime === null ? 0 : timeToMinutes(row.startTime);
    const end = row.endTime === null ? 24 * 60 : timeToMinutes(row.endTime);
    return intervalsOverlap(newStart, newEnd, start, end);
  });
  if (duplicatesBlockedPeriod) {
    throw new AppError(409, "This time-off period overlaps an existing time-off period.");
  }

  const conflictsWithAppointment = appointments.some((appointment) =>
    intervalsOverlap(
      newStart,
      newEnd,
      timeToMinutes(appointment.startTime),
      timeToMinutes(appointment.endTime)
    )
  );
  if (conflictsWithAppointment) {
    throw new AppError(409, "Time-off cannot be added because an active appointment already exists during this period.");
  }

  const created = await prisma.dentistTimeOff.create({
    data: { dentistId, date, startTime: input.startTime, endTime: input.endTime },
  });
  return toTimeOffDto(created);
}

export async function deleteDentistTimeOff(dentistId: number, timeOffId: number) {
  const deleted = await prisma.dentistTimeOff.deleteMany({ where: { id: timeOffId, dentistId } });
  if (deleted.count === 0) throw new AppError(404, "Time-off period not found.");
}
