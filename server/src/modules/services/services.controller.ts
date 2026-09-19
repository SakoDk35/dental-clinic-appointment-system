// server/src/modules/services/services.controller.ts

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../middleware/errorHandler";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";
import {
  listServices,
  getServiceById,
  createService,
  updateService,
  setServiceActive,
} from "./services.service";

function parseId(idParam: string): number {
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    throw new AppError(400, "Invalid service id.");
  }
  return id;
}

function validateServiceBody(body: Record<string, unknown>, isCreate: boolean) {
  const { name, durationMinutes, price } = body;

  if (isCreate || name !== undefined) {
    if (!name || typeof name !== "string" || !name.trim()) {
      throw new AppError(400, "Service name is required.");
    }
    if (name.length > VALIDATION_LIMITS.serviceName) {
      throw new AppError(400, `Service name must be ${VALIDATION_LIMITS.serviceName} characters or fewer.`);
    }
  }
  if (isCreate || durationMinutes !== undefined) {
    if (durationMinutes !== 30 && durationMinutes !== 60) {
      throw new AppError(400, "Duration must be 30 or 60 minutes.");
    }
  }
  if (isCreate || price !== undefined) {
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      throw new AppError(400, "Price must be a positive number.");
    }
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const isStaff = req.user?.role === "ADMIN" || req.user?.role === "RECEPTIONIST";
    const services = await listServices(!isStaff);
    res.status(200).json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const service = await getServiceById(parseId(req.params.id));
    res.status(200).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body ?? {};
    validateServiceBody(body, true);
    const service = await createService(body);
    res.status(201).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const body = req.body ?? {};
    validateServiceBody(body, false);
    const service = await updateService(id, body);
    res.status(200).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    const service = await setServiceActive(parseId(req.params.id), true);
    res.status(200).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const service = await setServiceActive(parseId(req.params.id), false);
    res.status(200).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
}
