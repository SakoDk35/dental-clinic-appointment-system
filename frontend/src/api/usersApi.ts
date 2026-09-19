// src/api/usersApi.ts
// Admin-only staff account management (Receptionist/Admin accounts).
// Dentist accounts are created via dentistsApi.ts instead, since a
// dentist needs a specialty + working hours created alongside the User.

import { apiRequest } from "./client";
import type { User, Role } from "../types";

export async function listUsers(token: string, role?: Role): Promise<User[]> {
  const query = role ? `?role=${role}` : "";
  return apiRequest<User[]>(`/users${query}`, { method: "GET" }, token);
}

export interface CreateStaffPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: "ADMIN" | "RECEPTIONIST";
}

export async function createStaffUser(token: string, payload: CreateStaffPayload): Promise<User> {
  return apiRequest<User>("/users", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function activateUser(token: string, id: number): Promise<User> {
  return apiRequest<User>(`/users/${id}/activate`, { method: "PATCH" }, token);
}

export async function deactivateUser(token: string, id: number): Promise<User> {
  return apiRequest<User>(`/users/${id}/deactivate`, { method: "PATCH" }, token);
}

export async function resetUserPassword(token: string, id: number, newPassword: string): Promise<void> {
  await apiRequest(`/users/${id}/reset-password`, { method: "PATCH", body: JSON.stringify({ newPassword }) }, token);
}
