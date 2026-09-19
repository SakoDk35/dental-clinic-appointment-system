// server/src/middleware/authorize.ts
//
// Usage on a route (always AFTER authenticate, which sets req.user):
//   router.post("/", authenticate, authorize(["ADMIN"]), createDentist);
//
// This is what actually enforces "Admin only" / "Receptionist and Admin
// only" etc. at the backend — not just something hidden in the UI.

import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";

export function authorize(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // Should not normally happen if authenticate runs first, but this
      // keeps the middleware safe to use on its own too.
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: "You do not have permission to perform this action." });
    }

    next();
  };
}
