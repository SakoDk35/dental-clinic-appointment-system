// server/src/modules/users/users.controller.ts

import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import { AppError } from "../../middleware/errorHandler";
import { validatePatientUpdateInput, validatePatientInput } from "../patients/patients.validation";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";
import {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  listUsers,
  getUserById,
  createStaffUser,
  setUserActive,
  deactivateUserSafely,
  adminResetPassword,
} from "./users.service";

const VALID_ROLES: Role[] = ["ADMIN", "RECEPTIONIST", "DENTIST", "PATIENT"];

function parseId(idParam: string): number {
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    throw new AppError(400, "Invalid user id.");
  }
  return id;
}

// ---- My own profile -------------------------------------------------

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await getMyProfile(req.user!.userId);
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, phone, dateOfBirth } = req.body ?? {};
    validatePatientUpdateInput({ fullName, phone, dateOfBirth });

    const profile = await updateMyProfile(req.user!.userId, { fullName, phone, dateOfBirth });
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body ?? {};

    if (!currentPassword || typeof currentPassword !== "string") {
      throw new AppError(400, "Current password is required.");
    }
    if (currentPassword.length > VALIDATION_LIMITS.password) {
      throw new AppError(400, "Current password is too long.");
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      throw new AppError(400, "New password must be at least 8 characters.");
    }
    if (newPassword.length > VALIDATION_LIMITS.password) {
      throw new AppError(400, `New password must be ${VALIDATION_LIMITS.password} characters or fewer.`);
    }

    await changeMyPassword(req.user!.userId, currentPassword, newPassword);
    res.status(200).json({ success: true, data: { message: "Password updated." } });
  } catch (err) {
    next(err);
  }
}

// ---- Admin staff management ------------------------------------------

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const roleParam = typeof req.query.role === "string" ? req.query.role.toUpperCase() : undefined;
    if (roleParam && !VALID_ROLES.includes(roleParam as Role)) {
      throw new AppError(400, "Invalid role filter.");
    }

    const users = await listUsers(roleParam as Role | undefined);
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const user = await getUserById(id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function createStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, email, password, phone, role } = req.body ?? {};
    validatePatientInput({ fullName, email, password, phone }, true, false);

    if (role !== "ADMIN" && role !== "RECEPTIONIST") {
      throw new AppError(400, "Role must be ADMIN or RECEPTIONIST.");
    }

    const user = await createStaffUser({ fullName, email, password, phone, role });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const user = await setUserActive(id, true);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const user = await deactivateUserSafely(id, req.user!.userId);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const { newPassword } = req.body ?? {};

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      throw new AppError(400, "New password must be at least 8 characters.");
    }
    if (newPassword.length > VALIDATION_LIMITS.password) {
      throw new AppError(400, `New password must be ${VALIDATION_LIMITS.password} characters or fewer.`);
    }

    await adminResetPassword(id, newPassword);
    res.status(200).json({ success: true, data: { message: "Password reset." } });
  } catch (err) {
    next(err);
  }
}
