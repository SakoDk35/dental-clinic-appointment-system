// server/src/modules/auth/auth.controller.ts

import type { Request, Response, NextFunction } from "express";
import { loginUser, registerPatient } from "./auth.service";
import { AppError } from "../../middleware/errorHandler";
import { validatePatientInput } from "../patients/patients.validation";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      throw new AppError(400, "Email and password are required.");
    }
    if (email.length > VALIDATION_LIMITS.email || password.length > VALIDATION_LIMITS.password) {
      throw new AppError(400, "Email or password is too long.");
    }

    const result = await loginUser({ email, password });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, email, password, phone, dateOfBirth } = req.body ?? {};
    validatePatientInput({ fullName, email, password, phone, dateOfBirth }, true);

    const user = await registerPatient({ fullName, email, password, phone, dateOfBirth });
    // No auto-login here on purpose — keeps the flow simple: register,
    // then log in separately with the same credentials.
    res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}
