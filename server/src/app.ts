// server/src/app.ts
//
// Every feature module is mounted here, one line per module. This file
// stays small on purpose — all the real logic lives in each module.

import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
import { authRoutes } from "./modules/auth/auth.routes";
import { patientsRoutes } from "./modules/patients/patients.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { dentistsRoutes } from "./modules/dentists/dentists.routes";
import { servicesRoutes } from "./modules/services/services.routes";
import { appointmentsRoutes } from "./modules/appointments/appointments.routes";
import { paymentsRoutes } from "./modules/payments/payments.routes";
import { notificationsRoutes } from "./modules/notifications/notifications.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(cors());
app.use(express.json());

// Basic infra check: confirms the server is up AND can reach the database.
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: "unreachable" });
  }
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/patients", patientsRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/dentists", dentistsRoutes);
app.use("/api/v1/services", servicesRoutes);
app.use("/api/v1/appointments", appointmentsRoutes);
app.use("/api/v1/payments", paymentsRoutes);
app.use("/api/v1/notifications", notificationsRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// Must be registered LAST — Express only treats a 4-arg function as an
// error handler, and it only catches errors from routes defined above it.
app.use(errorHandler);
