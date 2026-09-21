// server/src/middleware/authenticate.ts
//
// This is the REAL security boundary (the frontend's ProtectedRoute is
// UX convenience only). Any route that needs a logged-in user should
// list this middleware before its handler.

import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtPayload } from "../utils/jwt";
import { prisma } from "../lib/prisma";

// Lets every route handler read req.user with proper typing, without
// needing to redeclare this everywhere it's used.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  const token = header.slice("Bearer ".length);

  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired session. Please log in again." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "This account is no longer active. Please contact an administrator.",
      });
    }

    req.user = { userId: user.id, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
}
