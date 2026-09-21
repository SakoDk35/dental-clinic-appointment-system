// server/src/modules/dentists/dentists.controller.ts

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../middleware/errorHandler";
import {
  validateDentistInput,
  validateDentistUpdateInput,
  validateDentistTimeOffInput,
  validateWorkingHoursInput,
} from "./dentists.validation";
import {
  listDentists,
  getDentistById,
  createDentist,
  updateDentist,
  setDentistActive,
  setWorkingHours,
  listDentistTimeOff,
  createDentistTimeOff,
  deleteDentistTimeOff,
} from "./dentists.service";

function parseId(idParam: string): number {
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    throw new AppError(400, "Invalid dentist id.");
  }
  return id;
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    // Any logged-in role can list dentists (needed for the booking
    // dropdown), but only active ones unless the caller is staff managing
    // the roster.
    const isStaff = req.user?.role === "ADMIN" || req.user?.role === "RECEPTIONIST";
    const dentists = await listDentists(!isStaff);
    res.status(200).json({ success: true, data: dentists });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const dentist = await getDentistById(id);
    res.status(200).json({ success: true, data: dentist });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, email, password, phone, specialty } = req.body ?? {};
    validateDentistInput({ fullName, email, password, phone, specialty }, true);

    const dentist = await createDentist({ fullName, email, password, phone, specialty });
    res.status(201).json({ success: true, data: dentist });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const { fullName, phone, specialty } = req.body ?? {};
    validateDentistUpdateInput({ fullName, phone, specialty });

    const dentist = await updateDentist(id, { fullName, phone, specialty });
    res.status(200).json({ success: true, data: dentist });
  } catch (err) {
    next(err);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const dentist = await setDentistActive(id, true);
    res.status(200).json({ success: true, data: dentist });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const dentist = await setDentistActive(id, false);
    res.status(200).json({ success: true, data: dentist });
  } catch (err) {
    next(err);
  }
}

export async function updateWorkingHours(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const rows = validateWorkingHoursInput(req.body?.workingHours);

    const dentist = await setWorkingHours(id, rows);
    res.status(200).json({ success: true, data: dentist });
  } catch (err) {
    next(err);
  }
}

export async function listTimeOff(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await listDentistTimeOff(parseId(req.params.id));
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function createTimeOff(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validateDentistTimeOffInput(req.body ?? {});
    const row = await createDentistTimeOff(parseId(req.params.id), input);
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

export async function removeTimeOff(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteDentistTimeOff(parseId(req.params.id), parseId(req.params.timeOffId));
    res.status(200).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}
