// src/api/paymentsApi.ts
import { apiRequest } from "./client";
import type { Payment } from "../types";

interface ListPaymentsFilters {
  from?: string;
  to?: string;
  status?: "UNPAID" | "PAID" | "VOID";
}

export async function listPayments(token: string, filters: ListPaymentsFilters = {}): Promise<Payment[]> {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.status) params.set("status", filters.status);
  const query = params.toString() ? `?${params.toString()}` : "";

  return apiRequest<Payment[]>(`/payments${query}`, { method: "GET" }, token);
}

export async function markPaymentPaid(token: string, id: number): Promise<Payment> {
  return apiRequest<Payment>(`/payments/${id}/mark-paid`, { method: "PATCH" }, token);
}

export interface BillingSummary {
  totalRevenue: number;
  unpaidTotal: number;
  paidCount: number;
  unpaidCount: number;
}

// Admin-only on the backend — Receptionist must never call this.
export async function getBillingSummary(token: string): Promise<BillingSummary> {
  return apiRequest<BillingSummary>("/payments/summary", { method: "GET" }, token);
}
