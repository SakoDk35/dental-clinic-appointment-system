// src/api/patientsApi.ts
import { apiRequest } from "./client";
import type { User } from "../types";

export interface CreatePatientPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface UpdatePatientPayload {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
}

export async function listPatients(token: string, search?: string): Promise<User[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiRequest<User[]>(`/patients${query}`, { method: "GET" }, token);
}

export async function getPatient(token: string, id: number): Promise<User> {
  return apiRequest<User>(`/patients/${id}`, { method: "GET" }, token);
}

export async function createPatient(token: string, payload: CreatePatientPayload): Promise<User> {
  return apiRequest<User>("/patients", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function updatePatient(token: string, id: number, payload: UpdatePatientPayload): Promise<User> {
  return apiRequest<User>(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, token);
}

export async function activatePatient(token: string, id: number): Promise<User> {
  return apiRequest<User>(`/patients/${id}/activate`, { method: "PATCH" }, token);
}

export async function deactivatePatient(token: string, id: number): Promise<User> {
  return apiRequest<User>(`/patients/${id}/deactivate`, { method: "PATCH" }, token);
}

// ---- self profile (any role, but used by the Patient's My Profile page) ----

export async function getMyProfile(token: string): Promise<User> {
  return apiRequest<User>("/users/me", { method: "GET" }, token);
}

export async function updateMyProfile(token: string, payload: UpdatePatientPayload): Promise<User> {
  return apiRequest<User>("/users/me", { method: "PATCH", body: JSON.stringify(payload) }, token);
}

export async function changeMyPassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiRequest(
    "/users/me/password",
    { method: "PATCH", body: JSON.stringify({ currentPassword, newPassword }) },
    token
  );
}
