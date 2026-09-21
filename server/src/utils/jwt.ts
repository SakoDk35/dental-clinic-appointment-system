// server/src/utils/jwt.ts
//
// Small wrapper around jsonwebtoken so the rest of the app never imports
// the library directly. One place to change the secret/expiry later.

import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

function readJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

const JWT_SECRET = readJwtSecret();

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
