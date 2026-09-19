// server/src/modules/notifications/notifications.controller.ts

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../middleware/errorHandler";
import { listMyNotifications, markNotificationRead, markAllNotificationsRead } from "./notifications.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await listMyNotifications(req.user!.userId);
    res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new AppError(400, "Invalid notification id.");
    }

    const updated = await markNotificationRead(req.user!.userId, id);
    if (!updated) {
      throw new AppError(404, "Notification not found.");
    }

    res.status(200).json({ success: true, data: { message: "Marked as read." } });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await markAllNotificationsRead(req.user!.userId);
    res.status(200).json({ success: true, data: { message: "All notifications marked as read." } });
  } catch (err) {
    next(err);
  }
}
