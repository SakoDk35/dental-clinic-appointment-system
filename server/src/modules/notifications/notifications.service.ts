// server/src/modules/notifications/notifications.service.ts

import { prisma } from "../../lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

// Accepts either the normal prisma client or a transaction client, so
// appointments.service.ts can create a notification in the SAME
// transaction as the appointment itself.
type Db = PrismaClient | Prisma.TransactionClient;

interface CreateNotificationInput {
  userId: number;
  type: string;
  message: string;
  relatedAppointmentId?: number;
}

export async function createNotification(db: Db, input: CreateNotificationInput) {
  return db.notification.create({ data: input });
}

// Notifies every active Receptionist/Admin — used when a Patient
// self-books or self-cancels, per the approved requirement.
export async function notifyStaff(
  db: Db,
  message: string,
  type: string,
  relatedAppointmentId?: number
) {
  const staff = await db.user.findMany({
    where: { role: { in: ["RECEPTIONIST", "ADMIN"] }, isActive: true },
    select: { id: true },
  });

  if (staff.length === 0) return;

  await db.notification.createMany({
    data: staff.map((s) => ({ userId: s.id, type, message, relatedAppointmentId })),
  });
}

export async function listMyNotifications(userId: number) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function markNotificationRead(userId: number, id: number): Promise<boolean> {
  const result = await prisma.notification.updateMany({
    where: { id, userId }, // only ever updates the caller's own notification
    data: { isRead: true },
  });
  return result.count > 0;
}

export async function markAllNotificationsRead(userId: number) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
