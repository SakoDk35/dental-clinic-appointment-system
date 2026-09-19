// server/src/modules/dashboard/dashboard.service.ts
//
// Receptionist/Dentist/Patient dashboards are built entirely from
// GET /appointments (already role-scoped) on the frontend — no extra
// backend endpoint needed for those. Only the Admin dashboard needs
// numbers appointments alone can't give: revenue and active patient count.

import { prisma } from "../../lib/prisma";

export async function getAdminStats() {
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startOfNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const todaysAppointments = await prisma.appointment.count({
    where: { appointmentDate: todayUtc, status: { not: "CANCELLED" } },
  });

  const monthPayments = await prisma.payment.findMany({
    where: { appointment: { appointmentDate: { gte: startOfMonth, lt: startOfNextMonth } } },
    select: { amount: true, status: true },
  });
  const monthRevenue = monthPayments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const unpaidPayments = await prisma.payment.findMany({
    where: { status: "UNPAID" },
    select: { amount: true },
  });
  const unpaidTotal = unpaidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const activePatients = await prisma.user.count({ where: { role: "PATIENT", isActive: true } });

  return { todaysAppointments, monthRevenue, unpaidTotal, activePatients };
}
