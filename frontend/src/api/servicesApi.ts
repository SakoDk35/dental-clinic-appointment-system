// src/api/servicesApi.ts
import { apiRequest } from "./client";
import type { Service } from "../types";

export interface ServicePayload {
  name: string;
  durationMinutes: 30 | 60;
  price: number;
}

export async function listServices(token: string): Promise<Service[]> {
  return apiRequest<Service[]>("/services", { method: "GET" }, token);
}

export async function createService(token: string, payload: ServicePayload): Promise<Service> {
  return apiRequest<Service>("/services", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function updateService(
  token: string,
  id: number,
  payload: Partial<ServicePayload>
): Promise<Service> {
  return apiRequest<Service>(`/services/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, token);
}

export async function activateService(token: string, id: number): Promise<Service> {
  return apiRequest<Service>(`/services/${id}/activate`, { method: "PATCH" }, token);
}

export async function deactivateService(token: string, id: number): Promise<Service> {
  return apiRequest<Service>(`/services/${id}/deactivate`, { method: "PATCH" }, token);
}
