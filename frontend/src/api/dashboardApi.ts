// src/api/dashboardApi.ts
import { apiRequest } from "./client";

export interface AdminStats {
  todaysAppointments: number;
  monthRevenue: number;
  unpaidTotal: number;
  activePatients: number;
}

export async function getAdminStats(token: string): Promise<AdminStats> {
  return apiRequest<AdminStats>("/dashboard/admin", { method: "GET" }, token);
}
