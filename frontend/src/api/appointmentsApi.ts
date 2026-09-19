// src/api/appointmentsApi.ts
//
// Real backend calls. Role-scoping (Patient sees only their own, Dentist
// sees only their own) happens server-side based on the JWT — the
// frontend never needs to pass userId/role for that anymore.

import { apiRequest } from "./client";
import type { Appointment, TreatmentNote } from "../types";

interface ListAppointmentsFilters {
  date?: string; // "YYYY-MM-DD"
  dentistId?: number; // staff-only filter
  patientId?: number; // staff-only filter
}

export async function listAppointments(token: string, filters: ListAppointmentsFilters = {}): Promise<Appointment[]> {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.dentistId) params.set("dentistId", String(filters.dentistId));
  if (filters.patientId) params.set("patientId", String(filters.patientId));
  const query = params.toString() ? `?${params.toString()}` : "";

  return apiRequest<Appointment[]>(`/appointments${query}`, { method: "GET" }, token);
}

export async function getAppointment(token: string, id: number): Promise<Appointment> {
  return apiRequest<Appointment>(`/appointments/${id}`, { method: "GET" }, token);
}

export async function getAvailableSlots(
  token: string,
  dentistId: number,
  date: string,
  serviceId: number
): Promise<string[]> {
  const params = new URLSearchParams({ dentistId: String(dentistId), date, serviceId: String(serviceId) });
  return apiRequest<string[]>(`/appointments/available-slots?${params.toString()}`, { method: "GET" }, token);
}

export interface CreateAppointmentPayload {
  patientId?: number; // omitted when a Patient books for themselves
  dentistId: number;
  serviceId: number;
  appointmentDate: string;
  startTime: string;
}

export async function createAppointment(token: string, payload: CreateAppointmentPayload): Promise<Appointment> {
  return apiRequest<Appointment>("/appointments", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function confirmAppointment(token: string, id: number): Promise<Appointment> {
  return apiRequest<Appointment>(`/appointments/${id}/confirm`, { method: "PATCH" }, token);
}

export async function cancelAppointment(token: string, id: number): Promise<Appointment> {
  return apiRequest<Appointment>(`/appointments/${id}/cancel`, { method: "PATCH" }, token);
}

export async function completeAppointment(token: string, id: number): Promise<Appointment> {
  return apiRequest<Appointment>(`/appointments/${id}/complete`, { method: "PATCH" }, token);
}

export interface ReschedulePayload {
  dentistId?: number;
  appointmentDate?: string;
  startTime?: string;
}

export async function rescheduleAppointment(
  token: string,
  id: number,
  payload: ReschedulePayload
): Promise<Appointment> {
  return apiRequest<Appointment>(
    `/appointments/${id}/reschedule`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );
}

export async function addTreatmentNote(token: string, appointmentId: number, noteText: string): Promise<TreatmentNote> {
  return apiRequest<TreatmentNote>(
    `/appointments/${appointmentId}/notes`,
    { method: "POST", body: JSON.stringify({ noteText }) },
    token
  );
}

export async function updateTreatmentNote(
  token: string,
  appointmentId: number,
  noteText: string
): Promise<TreatmentNote> {
  return apiRequest<TreatmentNote>(
    `/appointments/${appointmentId}/notes`,
    { method: "PATCH", body: JSON.stringify({ noteText }) },
    token
  );
}

export async function getTreatmentNote(token: string, appointmentId: number): Promise<TreatmentNote | null> {
  return apiRequest<TreatmentNote | null>(`/appointments/${appointmentId}/notes`, { method: "GET" }, token);
}
