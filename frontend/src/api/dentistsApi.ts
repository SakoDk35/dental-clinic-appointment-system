// src/api/dentistsApi.ts
import { apiRequest } from "./client";
import type { Dentist, DentistTimeOff, WorkingHours } from "../types";

export interface CreateDentistPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  specialty?: string;
}

export interface UpdateDentistPayload {
  fullName?: string;
  phone?: string;
  specialty?: string;
}

export async function listDentists(token: string): Promise<Dentist[]> {
  return apiRequest<Dentist[]>("/dentists", { method: "GET" }, token);
}

export async function getDentist(token: string, id: number): Promise<Dentist> {
  return apiRequest<Dentist>(`/dentists/${id}`, { method: "GET" }, token);
}

export async function createDentist(token: string, payload: CreateDentistPayload): Promise<Dentist> {
  return apiRequest<Dentist>("/dentists", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function updateDentist(token: string, id: number, payload: UpdateDentistPayload): Promise<Dentist> {
  return apiRequest<Dentist>(`/dentists/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, token);
}

export async function activateDentist(token: string, id: number): Promise<Dentist> {
  return apiRequest<Dentist>(`/dentists/${id}/activate`, { method: "PATCH" }, token);
}

export async function deactivateDentist(token: string, id: number): Promise<Dentist> {
  return apiRequest<Dentist>(`/dentists/${id}/deactivate`, { method: "PATCH" }, token);
}

export async function setWorkingHours(
  token: string,
  id: number,
  workingHours: Omit<WorkingHours, "id" | "dentistId">[]
): Promise<Dentist> {
  return apiRequest<Dentist>(
    `/dentists/${id}/working-hours`,
    { method: "PUT", body: JSON.stringify({ workingHours }) },
    token
  );
}

export async function listDentistTimeOff(token: string, dentistId: number): Promise<DentistTimeOff[]> {
  return apiRequest<DentistTimeOff[]>(`/dentists/${dentistId}/time-off`, { method: "GET" }, token);
}

export async function createDentistTimeOff(
  token: string,
  dentistId: number,
  payload: { date: string; fullDay: boolean; startTime?: string; endTime?: string }
): Promise<DentistTimeOff> {
  return apiRequest<DentistTimeOff>(
    `/dentists/${dentistId}/time-off`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function deleteDentistTimeOff(token: string, dentistId: number, timeOffId: number): Promise<void> {
  await apiRequest<null>(`/dentists/${dentistId}/time-off/${timeOffId}`, { method: "DELETE" }, token);
}
