// server/src/modules/dentists/dentists.routes.ts

import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
  list,
  getOne,
  create,
  update,
  activate,
  deactivate,
  updateWorkingHours,
  listTimeOff,
  createTimeOff,
  removeTimeOff,
} from "./dentists.controller";

export const dentistsRoutes = Router();

const adminOnly = authorize(["ADMIN"]);

// Any logged-in user can view dentists (needed for the booking dropdown).
dentistsRoutes.get("/", authenticate, list);
dentistsRoutes.get("/:id", authenticate, getOne);

// Managing the dentist roster is Admin-only.
dentistsRoutes.post("/", authenticate, adminOnly, create);
dentistsRoutes.patch("/:id", authenticate, adminOnly, update);
dentistsRoutes.patch("/:id/activate", authenticate, adminOnly, activate);
dentistsRoutes.patch("/:id/deactivate", authenticate, adminOnly, deactivate);
dentistsRoutes.put("/:id/working-hours", authenticate, adminOnly, updateWorkingHours);
dentistsRoutes.get("/:id/time-off", authenticate, adminOnly, listTimeOff);
dentistsRoutes.post("/:id/time-off", authenticate, adminOnly, createTimeOff);
dentistsRoutes.delete("/:id/time-off/:timeOffId", authenticate, adminOnly, removeTimeOff);
