// server/src/utils/jwt.ts
//
// Small wrapper around jsonwebtoken so the rest of the app never imports
// the library directly. One place to change the secret/expiry later.

import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

// 8 hours ~ one clinic shift. Easy to change if that's not the right call.
const JWT_EXPIRES_IN = "8h";

export interface JwtPayload {
  userId: number;
  role: Role;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  // Throws if the token is invalid or expired — callers (authenticate
  // middleware) are responsible for catching this and returning a 401.
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
