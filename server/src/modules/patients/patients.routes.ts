// server/src/modules/patients/patients.routes.ts
//
// Every route here is staff-only (Admin/Receptionist), enforced with the
// SAME authorize() middleware used elsewhere — this is the real security
// boundary, independent of anything the frontend hides or shows.

import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { list, getOne, create, update, activate, deactivate } from "./patients.controller";

export const patientsRoutes = Router();

const staffOnly = authorize(["ADMIN", "RECEPTIONIST"]);

patientsRoutes.use(authenticate, staffOnly);

patientsRoutes.get("/", list);
patientsRoutes.get("/:id", getOne);
patientsRoutes.post("/", create);
patientsRoutes.patch("/:id", update);
patientsRoutes.patch("/:id/activate", activate);
patientsRoutes.patch("/:id/deactivate", deactivate);
