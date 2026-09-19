// server/src/modules/payments/payments.service.ts

import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";

const PAYMENT_INCLUDE = {
  appointment: { include: { patient: true, service: true } },
} as const;

type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: typeof PAYMENT_INCLUDE;
}>;

function toPaymentDto(payment: PaymentWithRelations) {
  return {
    id: payment.id,
    appointmentId: payment.appointmentId,
    patientName: payment.appointment.patient.fullName,
    serviceName: payment.appointment.service.name,
    date: payment.appointment.appointmentDate.toISOString().slice(0, 10),
    amount: Number(payment.amount),
    status: payment.status,
    paidAt: payment.paidAt ? payment.paidAt.toISOString() : undefined,
  };
}

interface ListPaymentsFilters {
  from?: string;
  to?: string;
  status?: "UNPAID" | "PAID";
}

export async function listPayments(filters: ListPaymentsFilters) {
  const payments = await prisma.payment.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.from || filters.to
        ? {
            appointment: {
              appointmentDate: {
                ...(filters.from ? { gte: new Date(filters.from) } : {}),
                ...(filters.to ? { lte: new Date(filters.to) } : {}),
              },
            },
          }
        : {}),
    },
    include: PAYMENT_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  return payments.map(toPaymentDto);
}

export async function getPaymentById(id: number) {
  const payment = await prisma.payment.findUnique({ where: { id }, include: PAYMENT_INCLUDE });
  if (!payment) {
    throw new AppError(404, "Payment not found.");
  }
  return toPaymentDto(payment);
}

export async function markPaymentPaid(id: number) {
  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Payment not found.");
  }
  if (existing.status === "PAID") {
    throw new AppError(409, "This payment has already been marked as paid.");
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
    include: PAYMENT_INCLUDE,
  });

  return toPaymentDto(updated);
}

// Admin-only revenue summary — Receptionist never sees this (enforced at
// the route level), matching the approved dashboard permissions.
export async function getBillingSummary(from?: string, to?: string) {
  const dateFilter =
    from || to
      ? { appointmentDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
      : {};

  const payments = await prisma.payment.findMany({
    where: { appointment: dateFilter },
    select: { amount: true, status: true },
  });

  const totalRevenue = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const unpaidTotal = payments
    .filter((p) => p.status === "UNPAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const paidCount = payments.filter((p) => p.status === "PAID").length;
  const unpaidCount = payments.filter((p) => p.status === "UNPAID").length;

  return { totalRevenue, unpaidTotal, paidCount, unpaidCount };
}
