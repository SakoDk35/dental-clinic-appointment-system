// server/src/modules/users/users.routes.ts

import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
  getMe,
  updateMe,
  changePassword,
  list,
  getOne,
  createStaff,
  activate,
  deactivate,
  resetPassword,
} from "./users.controller";

export const usersRoutes = Router();

// Any logged-in role can manage their own profile/password.
usersRoutes.get("/me", authenticate, getMe);
usersRoutes.patch("/me", authenticate, updateMe);
usersRoutes.patch("/me/password", authenticate, changePassword);

// Everything else here is Admin-only staff/account management.
const adminOnly = authorize(["ADMIN"]);

usersRoutes.get("/", authenticate, adminOnly, list);
usersRoutes.get("/:id", authenticate, adminOnly, getOne);
usersRoutes.post("/", authenticate, adminOnly, createStaff);
usersRoutes.patch("/:id/activate", authenticate, adminOnly, activate);
usersRoutes.patch("/:id/deactivate", authenticate, adminOnly, deactivate);
usersRoutes.patch("/:id/reset-password", authenticate, adminOnly, resetPassword);
