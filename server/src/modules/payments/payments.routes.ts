// server/src/modules/payments/payments.routes.ts

import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { list, getOne, markPaid, billingSummary } from "./payments.controller";

export const paymentsRoutes = Router();

const staffOnly = authorize(["ADMIN", "RECEPTIONIST"]);

// Billing summary (revenue) is Admin-only — Receptionist must never see
// financial totals, per the approved permissions table. Registered before
// the generic "/:id" route so it isn't swallowed by the id param.
paymentsRoutes.get("/summary", authenticate, authorize(["ADMIN"]), billingSummary);

paymentsRoutes.get("/", authenticate, staffOnly, list);
paymentsRoutes.get("/:id", authenticate, staffOnly, getOne);
paymentsRoutes.patch("/:id/mark-paid", authenticate, staffOnly, markPaid);
