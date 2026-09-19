// server/src/modules/appointments/appointments.routes.ts

import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
  availableSlots,
  create,
  list,
  getOne,
  confirm,
  cancel,
  complete,
  reschedule,
  addNote,
  editNote,
  getNote,
} from "./appointments.controller";

export const appointmentsRoutes = Router();

appointmentsRoutes.use(authenticate);

appointmentsRoutes.get("/available-slots", availableSlots);

// Booking: Patients book for themselves, staff can book for any patient.
appointmentsRoutes.post("/", authorize(["PATIENT", "RECEPTIONIST", "ADMIN"]), create);

// Listing/viewing is role-scoped INSIDE the service (Patients/Dentists
// only ever see their own), so every role may call these two.
appointmentsRoutes.get("/", list);
appointmentsRoutes.get("/:id", getOne);

appointmentsRoutes.patch("/:id/confirm", authorize(["RECEPTIONIST", "ADMIN"]), confirm);
appointmentsRoutes.patch("/:id/cancel", authorize(["PATIENT", "RECEPTIONIST", "ADMIN"]), cancel);
appointmentsRoutes.patch("/:id/complete", authorize(["DENTIST"]), complete);
appointmentsRoutes.patch("/:id/reschedule", authorize(["RECEPTIONIST", "ADMIN"]), reschedule);

appointmentsRoutes.post("/:id/notes", authorize(["DENTIST"]), addNote);
appointmentsRoutes.patch("/:id/notes", authorize(["DENTIST"]), editNote);
appointmentsRoutes.get("/:id/notes", authorize(["DENTIST", "ADMIN"]), getNote);
