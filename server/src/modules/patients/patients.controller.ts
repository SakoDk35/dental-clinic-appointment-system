// server/src/modules/patients/patients.controller.ts

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../middleware/errorHandler";
import { validatePatientInput, validatePatientUpdateInput } from "./patients.validation";
import {
  listPatients,
  getPatientById,
  createPatient,
  updatePatient,
  setPatientActive,
} from "./patients.service";

function parseId(idParam: string): number {
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    throw new AppError(400, "Invalid patient id.");
  }
  return id;
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const patients = await listPatients(search);
    res.status(200).json({ success: true, data: patients });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const patient = await getPatientById(id);
    res.status(200).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, email, password, phone, dateOfBirth } = req.body ?? {};
    validatePatientInput({ fullName, email, password, phone, dateOfBirth }, true);

    const patient = await createPatient({ fullName, email, password, phone, dateOfBirth });
    res.status(201).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const { fullName, phone, dateOfBirth } = req.body ?? {};
    validatePatientUpdateInput({ fullName, phone, dateOfBirth });

    const patient = await updatePatient(id, { fullName, phone, dateOfBirth });
    res.status(200).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const patient = await setPatientActive(id, true);
    res.status(200).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const patient = await setPatientActive(id, false);
    res.status(200).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}
