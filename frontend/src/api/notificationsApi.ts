// src/api/notificationsApi.ts
//
// Real backend calls, same function names NotificationBell.tsx already
// used against the mock — only the token parameter is new.

import { apiRequest } from "./client";
import type { AppNotification } from "../types";

export async function getNotifications(token: string): Promise<AppNotification[]> {
  return apiRequest<AppNotification[]>("/notifications", { method: "GET" }, token);
}

export async function markNotificationRead(token: string, id: number): Promise<void> {
  await apiRequest(`/notifications/${id}/read`, { method: "PATCH" }, token);
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  await apiRequest("/notifications/read-all", { method: "PATCH" }, token);
}
