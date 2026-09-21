// server/src/modules/users/users.service.ts
//
// Two kinds of functions live here:
// 1. "My own profile" — works for any logged-in role (getMyProfile, etc.)
// 2. Admin-only staff management — list/create/activate/deactivate any
//    user, and password changes. Patient-specific management (with its
//    own extra rules) stays in patients.service.ts; this file handles
//    Admin/Receptionist/Dentist accounts plus the shared "me" actions.

import bcrypt from "bcrypt";
import type { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";

const SALT_ROUNDS = 10;

function toSafeUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

// ---- My own profile -------------------------------------------------

export async function getMyProfile(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found.");
  }
  return toSafeUser(user);
}

interface UpdateMyProfileInput {
  fullName?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
}

// Email, role, and isActive are never accepted here on purpose:
// - email is locked per the approved UI decision (login identifier)
// - role/isActive are not something a user should ever change on themselves
export async function updateMyProfile(userId: number, input: UpdateMyProfileInput) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.fullName !== undefined ? { fullName: input.fullName.trim() } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.dateOfBirth !== undefined
        ? { dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null }
        : {}),
    },
  });

  return toSafeUser(updated);
}

export async function changeMyPassword(userId: number, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found.");
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw new AppError(401, "Current password is incorrect.");
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

// ---- Admin staff management ------------------------------------------

// Only Receptionist/Admin accounts get created here. Dentist accounts are
// created through the Dentists module (they need a specialty + working
// hours created alongside the User), and Patient accounts are created
// through the Patients module or self-registration.
const CREATABLE_STAFF_ROLES: Role[] = ["ADMIN", "RECEPTIONIST"];

export async function listUsers(roleFilter?: Role) {
  const users = await prisma.user.findMany({
    where: roleFilter ? { role: roleFilter } : undefined,
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
  });
  return users.map(toSafeUser);
}

export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, "User not found.");
  }
  return toSafeUser(user);
}

interface CreateStaffInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
}

export async function createStaffUser(input: CreateStaffInput) {
  if (!CREATABLE_STAFF_ROLES.includes(input.role)) {
    throw new AppError(
      400,
      "This endpoint can only create Admin or Receptionist accounts. Dentists are created from the Dentists page."
    );
  }

  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName.trim(),
      email,
      passwordHash,
      phone: input.phone ?? null,
      role: input.role,
    },
  });

  return toSafeUser(user);
}

export async function setUserActive(id: number, isActive: boolean) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "User not found.");
  }

  const updated = await prisma.user.update({ where: { id }, data: { isActive } });
  return toSafeUser(updated);
}

export async function deactivateUserSafely(id: number, requesterId: number) {
  if (id === requesterId) {
    throw new AppError(409, "You cannot deactivate your own account.");
  }

  // Serializable isolation keeps concurrent Admin deactivations from
  // accidentally removing the final active Admin account.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const existing = await tx.user.findUnique({ where: { id } });
          if (!existing) {
            throw new AppError(404, "User not found.");
          }

          if (existing.role === "ADMIN" && existing.isActive) {
            const activeAdminCount = await tx.user.count({
              where: { role: "ADMIN", isActive: true },
            });
            if (activeAdminCount <= 1) {
              throw new AppError(409, "At least one active Admin account must remain.");
            }
          }

          const updated = await tx.user.update({ where: { id }, data: { isActive: false } });
          return toSafeUser(updated);
        },
        { isolationLevel: "Serializable" }
      );
    } catch (error) {
      if (error instanceof AppError || attempt === 2) throw error;
      if (!(error instanceof Error) || !error.message.includes("P2034")) throw error;
    }
  }

  throw new AppError(409, "The account could not be deactivated. Please try again.");
}

// Admin resetting someone else's password — no "current password" check,
// since the whole point is the user can no longer log in to prove it.
export async function adminResetPassword(id: number, newPassword: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "User not found.");
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
}
