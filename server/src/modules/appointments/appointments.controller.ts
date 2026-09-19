// server/src/modules/appointments/appointments.controller.ts

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../middleware/errorHandler";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";
import {
  validateCreateAppointmentInput,
  validateRescheduleInput,
  validateAvailableSlotsQuery,
} from "./appointments.validation";
import {
  getAvailableSlots,
  createAppointment,
  listAppointments,
  getAppointmentById,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  rescheduleAppointment,
  addTreatmentNote,
  updateTreatmentNote,
  getTreatmentNote,
} from "./appointments.service";

function parseId(idParam: string): number {
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    throw new AppError(400, "Invalid appointment id.");
  }
  return id;
}

export async function availableSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const dentistId = Number(req.query.dentistId);
    if (!Number.isInteger(dentistId)) {
      throw new AppError(400, "dentistId query parameter is required.");
    }
    const { date, serviceId } = validateAvailableSlotsQuery(req.query.date, req.query.serviceId);

    const slots = await getAvailableSlots(dentistId, date, serviceId);
    res.status(200).json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { patientId, dentistId, serviceId, appointmentDate, startTime } = req.body ?? {};
    validateCreateAppointmentInput({ dentistId, serviceId, appointmentDate, startTime });

    const requester = req.user!;

    // A Patient can only ever book for themselves — patientId in the body
    // is ignored for that role, never trusted from the client.
    let resolvedPatientId: number;
    if (requester.role === "PATIENT") {
      resolvedPatientId = requester.userId;
    } else {
      if (typeof patientId !== "number" || !Number.isInteger(patientId)) {
        throw new AppError(400, "patientId is required when staff books on a patient's behalf.");
      }
      resolvedPatientId = patientId;
    }

    const appointment = await createAppointment({
      patientId: resolvedPatientId,
      dentistId,
      serviceId,
      appointmentDate,
      startTime,
      createdById: requester.userId,
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const requester = req.user!;
    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    const dentistId = req.query.dentistId ? Number(req.query.dentistId) : undefined;
    const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;

    const appointments = await listAppointments({
      role: requester.role,
      userId: requester.userId,
      date,
      dentistId: Number.isInteger(dentistId) ? dentistId : undefined,
      patientId: Number.isInteger(patientId) ? patientId : undefined,
    });

    res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const appointment = await getAppointmentById(id, req.user!);
    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}

export async function confirm(req: Request, res: Response, next: NextFunction) {
  try {
    const appointment = await confirmAppointment(parseId(req.params.id));
    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const appointment = await cancelAppointment(parseId(req.params.id), req.user!);
    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}

export async function complete(req: Request, res: Response, next: NextFunction) {
  try {
    const appointment = await completeAppointment(parseId(req.params.id), req.user!.userId);
    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}

export async function reschedule(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const { dentistId, appointmentDate, startTime } = req.body ?? {};
    validateRescheduleInput({ dentistId, appointmentDate, startTime });

    const appointment = await rescheduleAppointment(id, { dentistId, appointmentDate, startTime });
    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}

export async function addNote(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const { noteText } = req.body ?? {};
    if (!noteText || typeof noteText !== "string" || !noteText.trim()) {
      throw new AppError(400, "noteText is required.");
    }
    if (noteText.length > VALIDATION_LIMITS.treatmentNote) {
      throw new AppError(400, `Treatment note must be ${VALIDATION_LIMITS.treatmentNote} characters or fewer.`);
    }

    const note = await addTreatmentNote(id, req.user!.userId, noteText);
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
}

export async function editNote(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const { noteText } = req.body ?? {};
    if (!noteText || typeof noteText !== "string" || !noteText.trim()) {
      throw new AppError(400, "noteText is required.");
    }
    if (noteText.length > VALIDATION_LIMITS.treatmentNote) {
      throw new AppError(400, `Treatment note must be ${VALIDATION_LIMITS.treatmentNote} characters or fewer.`);
    }

    const note = await updateTreatmentNote(id, req.user!.userId, noteText);
    res.status(200).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
}

export async function getNote(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const note = await getTreatmentNote(id, req.user!);
    res.status(200).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
}
