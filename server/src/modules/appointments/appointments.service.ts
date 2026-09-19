// server/src/modules/appointments/appointments.service.ts
//
// The most business-rule-heavy module in the MVP. Key rule enforced here,
// independent of anything the frontend does: a dentist can never end up
// with two overlapping appointments on the same day.

import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { getClinicDateTimeParts, isClinicDateTimeInPast } from "../../utils/clinicTime";
import { createNotification, notifyStaff } from "../notifications/notifications.service";

// ---- small time helpers (plain strings/numbers, no date library needed) ----

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// dateStr is "YYYY-MM-DD". Using UTC consistently (matches how Prisma
// stores/reads the @db.Date column) avoids local-timezone off-by-one bugs.
function getDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function dateStrToUtcDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function intervalsOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

// Appointments can't be made in the past. Enforced here rather than only in
// the date picker, since the frontend is not a security or correctness
// boundary. Compared in UTC to match how dates are stored.
function assertNotInThePast(dateStr: string, startTime: string) {
  if (isClinicDateTimeInPast(dateStr, startTime)) {
    throw new AppError(400, "Appointments cannot be scheduled in the past.");
  }
}

function isOverlapConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const meta = error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined;
  const details = `${error.message} ${JSON.stringify(meta ?? {})}`;
  return details.includes("Appointment_no_active_overlap") || details.includes("23P01");
}

function throwBookingConflict(error: unknown): never {
  if (isOverlapConstraintError(error)) {
    throw new AppError(409, "This time slot is no longer available. Please choose another.");
  }
  throw error;
}

// ---- shaping a Prisma appointment row into the frontend's Appointment shape ----

const APPOINTMENT_INCLUDE = {
  patient: true,
  dentist: { include: { user: true } },
  service: true,
} as const;

type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof APPOINTMENT_INCLUDE;
}>;

function toAppointmentDto(appt: AppointmentWithRelations) {
  return {
    id: appt.id,
    patient: { id: appt.patient.id, fullName: appt.patient.fullName, phone: appt.patient.phone },
    dentist: {
      id: appt.dentist.id,
      fullName: appt.dentist.user.fullName,
      specialty: appt.dentist.specialty,
    },
    service: {
      id: appt.service.id,
      name: appt.service.name,
      price: Number(appt.service.price),
      durationMinutes: appt.service.durationMinutes,
    },
    appointmentDate: formatDate(appt.appointmentDate),
    startTime: appt.startTime,
    endTime: appt.endTime,
    status: appt.status,
    createdById: appt.createdById,
  };
}

// ---- available slots ----

export async function getAvailableSlots(dentistId: number, dateStr: string, serviceId: number) {
  const dentist = await prisma.dentist.findUnique({
    where: { id: dentistId },
    include: { workingHours: true, user: true },
  });
  if (!dentist || !dentist.user.isActive) {
    throw new AppError(404, "Dentist not found.");
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) {
    throw new AppError(404, "Service not found.");
  }

  const dayOfWeek = getDayOfWeek(dateStr);
  const hours = dentist.workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);
  if (!hours) {
    return []; // dentist doesn't work that day
  }

  const existing = await prisma.appointment.findMany({
    where: {
      dentistId,
      appointmentDate: dateStrToUtcDate(dateStr),
      status: { not: "CANCELLED" },
    },
    select: { startTime: true, endTime: true },
  });
  const bookedIntervals = existing.map((a) => ({
    start: timeToMinutes(a.startTime),
    end: timeToMinutes(a.endTime),
  }));

  const workStart = timeToMinutes(hours.startTime);
  const workEnd = timeToMinutes(hours.endTime);
  const duration = service.durationMinutes;

  // On today's date, don't offer times that have already passed — otherwise
  // the picker would show slots that assertNotInThePast rejects on submit.
  const clinicNow = getClinicDateTimeParts();
  const isToday = dateStr === clinicNow.date;
  const earliest = isToday ? clinicNow.minutes : 0;

  const slots: string[] = [];
  for (let start = workStart; start + duration <= workEnd; start += 30) {
    if (start < earliest) continue;
    const end = start + duration;
    const conflicts = bookedIntervals.some((b) => intervalsOverlap(start, end, b.start, b.end));
    if (!conflicts) {
      slots.push(minutesToTime(start));
    }
  }

  return slots;
}

// ---- create ----

interface CreateAppointmentInput {
  patientId: number;
  dentistId: number;
  serviceId: number;
  appointmentDate: string;
  startTime: string;
  createdById: number;
}

async function assertSlotIsFree(
  dentistId: number,
  dateStr: string,
  startMinutes: number,
  endMinutes: number,
  excludeAppointmentId?: number
) {
  const existing = await prisma.appointment.findMany({
    where: {
      dentistId,
      appointmentDate: dateStrToUtcDate(dateStr),
      status: { not: "CANCELLED" },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: { startTime: true, endTime: true },
  });

  const conflict = existing.some((a) =>
    intervalsOverlap(startMinutes, endMinutes, timeToMinutes(a.startTime), timeToMinutes(a.endTime))
  );

  if (conflict) {
    throw new AppError(409, "This time slot is no longer available. Please choose another.");
  }
}

async function assertWithinWorkingHours(
  dentistId: number,
  dateStr: string,
  startMinutes: number,
  endMinutes: number
) {
  const dayOfWeek = getDayOfWeek(dateStr);
  const hours = await prisma.workingHours.findUnique({
    where: { dentistId_dayOfWeek: { dentistId, dayOfWeek } },
  });

  if (!hours) {
    throw new AppError(400, "The dentist does not work on the selected day.");
  }

  if (startMinutes < timeToMinutes(hours.startTime) || endMinutes > timeToMinutes(hours.endTime)) {
    throw new AppError(400, "The selected time is outside the dentist's working hours.");
  }
}

export async function createAppointment(input: CreateAppointmentInput) {
  const dentist = await prisma.dentist.findUnique({
    where: { id: input.dentistId },
    include: { user: true },
  });
  if (!dentist || !dentist.user.isActive) {
    throw new AppError(404, "Dentist not found.");
  }

  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service || !service.isActive) {
    throw new AppError(404, "Service not found.");
  }

  const patient = await prisma.user.findFirst({ where: { id: input.patientId, role: "PATIENT" } });
  if (!patient || !patient.isActive) {
    throw new AppError(404, "Patient not found.");
  }

  const startMinutes = timeToMinutes(input.startTime);
  const endMinutes = startMinutes + service.durationMinutes;
  const endTime = minutesToTime(endMinutes);

  assertNotInThePast(input.appointmentDate, input.startTime);
  await assertWithinWorkingHours(input.dentistId, input.appointmentDate, startMinutes, endMinutes);
  await assertSlotIsFree(input.dentistId, input.appointmentDate, startMinutes, endMinutes);

  let appointment: AppointmentWithRelations;
  try {
    appointment = await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: {
          patientId: input.patientId,
          dentistId: input.dentistId,
          serviceId: input.serviceId,
          createdById: input.createdById,
          appointmentDate: dateStrToUtcDate(input.appointmentDate),
          startTime: input.startTime,
          endTime,
          status: "BOOKED",
        },
        include: APPOINTMENT_INCLUDE,
      });

      await tx.payment.create({
        data: { appointmentId: created.id, amount: service.price, status: "UNPAID" },
      });

      await createNotification(tx, {
        userId: input.patientId,
        type: "APPOINTMENT_BOOKED",
        message: `Your appointment on ${input.appointmentDate} at ${input.startTime} has been booked.`,
        relatedAppointmentId: created.id,
      });

      // Only notify staff when the PATIENT booked it themselves — a
      // Receptionist/Admin booking on the patient's behalf already knows.
      if (input.createdById === input.patientId) {
        await notifyStaff(
          tx,
          `${patient.fullName} booked an appointment on ${input.appointmentDate} at ${input.startTime}.`,
          "PATIENT_SELF_BOOKED",
          created.id
        );
      }

      return created;
    });
  } catch (error) {
    throwBookingConflict(error);
  }

  return toAppointmentDto(appointment);
}

// ---- list / get ----

interface ListAppointmentsParams {
  role: "ADMIN" | "RECEPTIONIST" | "DENTIST" | "PATIENT";
  userId: number;
  date?: string;
  dentistId?: number;
  patientId?: number;
}

export async function listAppointments(params: ListAppointmentsParams) {
  const where: Record<string, unknown> = {};

  if (params.role === "PATIENT") {
    where.patientId = params.userId;
  } else if (params.role === "DENTIST") {
    const dentist = await prisma.dentist.findUnique({ where: { userId: params.userId } });
    if (!dentist) {
      throw new AppError(404, "Dentist profile not found for this account.");
    }
    where.dentistId = dentist.id;
  } else {
    // ADMIN/RECEPTIONIST may optionally filter by a specific dentist or patient.
    if (params.dentistId) where.dentistId = params.dentistId;
    if (params.patientId) where.patientId = params.patientId;
  }

  if (params.date) {
    where.appointmentDate = dateStrToUtcDate(params.date);
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: APPOINTMENT_INCLUDE,
    orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
  });

  return appointments.map(toAppointmentDto);
}

async function getAppointmentOrThrow(id: number) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: APPOINTMENT_INCLUDE,
  });
  if (!appointment) {
    throw new AppError(404, "Appointment not found.");
  }
  return appointment;
}

function assertCanAccessAppointment(
  appointment: AppointmentWithRelations,
  requester: { role: string; userId: number }
) {
  if (requester.role === "PATIENT" && appointment.patient.id !== requester.userId) {
    throw new AppError(403, "You do not have permission to view this appointment.");
  }
  if (requester.role === "DENTIST" && appointment.dentist.user.id !== requester.userId) {
    throw new AppError(403, "You do not have permission to view this appointment.");
  }
}

export async function getAppointmentById(id: number, requester: { role: string; userId: number }) {
  const appointment = await getAppointmentOrThrow(id);
  assertCanAccessAppointment(appointment, requester);
  return toAppointmentDto(appointment);
}

// ---- status transitions ----

export async function confirmAppointment(id: number) {
  const appointment = await getAppointmentOrThrow(id);

  if (appointment.status !== "BOOKED") {
    throw new AppError(409, "Only booked appointments can be confirmed.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.appointment.update({
      where: { id },
      data: { status: "CONFIRMED" },
      include: APPOINTMENT_INCLUDE,
    });
    await createNotification(tx, {
      userId: result.patientId,
      type: "APPOINTMENT_CONFIRMED",
      message: `Your appointment on ${formatDate(result.appointmentDate)} at ${result.startTime} has been confirmed.`,
      relatedAppointmentId: result.id,
    });
    return result;
  });

  return toAppointmentDto(updated);
}

export async function cancelAppointment(id: number, requester: { role: string; userId: number }) {
  const appointment = await getAppointmentOrThrow(id);
  // Throws for a Patient trying to cancel someone else's appointment, and
  // for a Dentist touching an appointment that isn't theirs.
  assertCanAccessAppointment(appointment, requester);

  if (appointment.status !== "BOOKED" && appointment.status !== "CONFIRMED") {
    throw new AppError(409, "This appointment can no longer be cancelled.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: APPOINTMENT_INCLUDE,
    });

    await createNotification(tx, {
      userId: result.patientId,
      type: "APPOINTMENT_CANCELLED",
      message: `Your appointment on ${formatDate(result.appointmentDate)} at ${result.startTime} has been cancelled.`,
      relatedAppointmentId: result.id,
    });

    if (requester.role === "PATIENT") {
      await notifyStaff(
        tx,
        `${result.patient.fullName} cancelled their appointment on ${formatDate(result.appointmentDate)} at ${result.startTime}.`,
        "PATIENT_SELF_CANCELLED",
        result.id
      );
    }

    return result;
  });

  return toAppointmentDto(updated);
}

export async function completeAppointment(id: number, dentistUserId: number) {
  const appointment = await getAppointmentOrThrow(id);

  if (appointment.dentist.user.id !== dentistUserId) {
    throw new AppError(403, "You can only complete your own appointments.");
  }
  if (appointment.status === "COMPLETED" || appointment.status === "CANCELLED") {
    throw new AppError(409, "This appointment can no longer be marked completed.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.appointment.update({
      where: { id },
      data: { status: "COMPLETED" },
      include: APPOINTMENT_INCLUDE,
    });
    await createNotification(tx, {
      userId: result.patientId,
      type: "APPOINTMENT_COMPLETED",
      message: `Your appointment on ${formatDate(result.appointmentDate)} at ${result.startTime} has been completed.`,
      relatedAppointmentId: result.id,
    });
    return result;
  });

  return toAppointmentDto(updated);
}

interface RescheduleInput {
  dentistId?: number;
  appointmentDate?: string;
  startTime?: string;
}

export async function rescheduleAppointment(id: number, input: RescheduleInput) {
  const appointment = await getAppointmentOrThrow(id);

  if (appointment.status !== "BOOKED" && appointment.status !== "CONFIRMED") {
    throw new AppError(409, "This appointment can no longer be modified.");
  }

  const dentistId = input.dentistId ?? appointment.dentistId;
  const appointmentDate = input.appointmentDate ?? formatDate(appointment.appointmentDate);
  const startTime = input.startTime ?? appointment.startTime;

  if (input.dentistId) {
    const dentist = await prisma.dentist.findUnique({ where: { id: dentistId }, include: { user: true } });
    if (!dentist || !dentist.user.isActive) {
      throw new AppError(404, "Dentist not found.");
    }
  }

  const startMinutes = timeToMinutes(startTime);
  const duration = appointment.service.durationMinutes;
  const endMinutes = startMinutes + duration;
  const endTime = minutesToTime(endMinutes);

  assertNotInThePast(appointmentDate, startTime);
  await assertWithinWorkingHours(dentistId, appointmentDate, startMinutes, endMinutes);
  await assertSlotIsFree(dentistId, appointmentDate, startMinutes, endMinutes, id);

  let updated: AppointmentWithRelations;
  try {
    updated = await prisma.$transaction(async (tx) => {
      const result = await tx.appointment.update({
        where: { id },
        data: {
          dentistId,
          appointmentDate: dateStrToUtcDate(appointmentDate),
          startTime,
          endTime,
        },
        include: APPOINTMENT_INCLUDE,
      });

      await createNotification(tx, {
        userId: result.patientId,
        type: "APPOINTMENT_RESCHEDULED",
        message: `Your appointment has been rescheduled to ${appointmentDate} at ${startTime}.`,
        relatedAppointmentId: result.id,
      });

      return result;
    });
  } catch (error) {
    throwBookingConflict(error);
  }

  return toAppointmentDto(updated);
}

// ---- treatment notes ----

export async function addTreatmentNote(appointmentId: number, dentistUserId: number, noteText: string) {
  const appointment = await getAppointmentOrThrow(appointmentId);

  if (appointment.dentist.user.id !== dentistUserId) {
    throw new AppError(403, "You can only add notes to your own appointments.");
  }

  const existing = await prisma.treatmentNote.findUnique({ where: { appointmentId } });
  if (existing) {
    throw new AppError(409, "A note already exists for this appointment. Use update instead.");
  }

  return prisma.treatmentNote.create({
    data: { appointmentId, dentistId: appointment.dentistId, noteText },
  });
}

export async function updateTreatmentNote(appointmentId: number, dentistUserId: number, noteText: string) {
  const appointment = await getAppointmentOrThrow(appointmentId);

  if (appointment.dentist.user.id !== dentistUserId) {
    throw new AppError(403, "You can only edit notes on your own appointments.");
  }

  const existing = await prisma.treatmentNote.findUnique({ where: { appointmentId } });
  if (!existing) {
    throw new AppError(404, "No note exists yet for this appointment.");
  }

  return prisma.treatmentNote.update({ where: { appointmentId }, data: { noteText } });
}

export async function getTreatmentNote(appointmentId: number, requester: { role: string; userId: number }) {
  const appointment = await getAppointmentOrThrow(appointmentId);

  // Only the writing dentist and Admin may ever read a treatment note —
  // Receptionist and Patient are blocked here, independent of the frontend.
  const isOwningDentist = requester.role === "DENTIST" && appointment.dentist.user.id === requester.userId;
  const isAdmin = requester.role === "ADMIN";
  if (!isOwningDentist && !isAdmin) {
    throw new AppError(403, "You do not have permission to view this note.");
  }

  const note = await prisma.treatmentNote.findUnique({ where: { appointmentId } });
  return note; // null is a valid result — note is optional
}
