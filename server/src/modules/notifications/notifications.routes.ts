// server/src/modules/notifications/notifications.routes.ts

import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { list, markRead, markAllRead } from "./notifications.controller";

export const notificationsRoutes = Router();

notificationsRoutes.get("/", authenticate, list);
notificationsRoutes.patch("/read-all", authenticate, markAllRead);
notificationsRoutes.patch("/:id/read", authenticate, markRead);
