// server/src/modules/services/services.routes.ts

import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { list, getOne, create, update, activate, deactivate } from "./services.controller";

export const servicesRoutes = Router();

const adminOnly = authorize(["ADMIN"]);

servicesRoutes.get("/", authenticate, list);
servicesRoutes.get("/:id", authenticate, getOne);
servicesRoutes.post("/", authenticate, adminOnly, create);
servicesRoutes.patch("/:id", authenticate, adminOnly, update);
servicesRoutes.patch("/:id/activate", authenticate, adminOnly, activate);
servicesRoutes.patch("/:id/deactivate", authenticate, adminOnly, deactivate);
