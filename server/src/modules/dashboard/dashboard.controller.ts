// server/src/modules/dashboard/dashboard.controller.ts

import type { Request, Response, NextFunction } from "express";
import { getAdminStats } from "./dashboard.service";

export async function adminStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getAdminStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}
