// server/src/modules/dashboard/dashboard.routes.ts

import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { adminStats } from "./dashboard.controller";

export const dashboardRoutes = Router();

dashboardRoutes.get("/admin", authenticate, authorize(["ADMIN"]), adminStats);
