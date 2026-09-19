// server/src/modules/services/services.service.ts

import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";

export async function listServices(activeOnly: boolean) {
  return prisma.service.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function getServiceById(id: number) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    throw new AppError(404, "Service not found.");
  }
  return service;
}

interface ServiceInput {
  name: string;
  durationMinutes: 30 | 60;
  price: number;
}

export async function createService(input: ServiceInput) {
  return prisma.service.create({ data: input });
}

interface ServiceUpdateInput {
  name?: string;
  durationMinutes?: 30 | 60;
  price?: number;
}

export async function updateService(id: number, input: ServiceUpdateInput) {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Service not found.");
  }
  return prisma.service.update({ where: { id }, data: input });
}

export async function setServiceActive(id: number, isActive: boolean) {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Service not found.");
  }
  return prisma.service.update({ where: { id }, data: { isActive } });
}
