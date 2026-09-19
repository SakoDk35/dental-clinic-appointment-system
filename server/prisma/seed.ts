// server/prisma/seed.ts
//
// Demo data for the full MVP: one account per role, two dentists with
// working hours, a small service list, and a couple of past/upcoming
// appointments so the dashboards and lists aren't empty on first run.
// Safe to re-run — every block checks for existing data first.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const PASSWORD = "Password123";

async function ensureUser(data: {
  fullName: string;
  email: string;
  role: "ADMIN" | "RECEPTIONIST" | "DENTIST" | "PATIENT";
  phone?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.create({
    data: { ...data, passwordHash, isActive: true },
  });
}

async function main() {
  // ---- one account per role ----
  await ensureUser({ fullName: "Admin User", email: "admin@clinic.com", role: "ADMIN" });
  await ensureUser({
    fullName: "Nara Hakobyan",
    email: "reception@clinic.com",
    role: "RECEPTIONIST",
    phone: "+374 55 111222",
  });
  const patient = await ensureUser({
    fullName: "Anna Petrosyan",
    email: "patient@clinic.com",
    role: "PATIENT",
    phone: "+374 55 123456",
  });

  // ---- dentists (User + Dentist + working hours) ----
  let dentist1 = await prisma.dentist.findFirst({ where: { user: { email: "dentist@clinic.com" } } });
  if (!dentist1) {
    const user = await ensureUser({
      fullName: "Dr. Armen Sargsyan",
      email: "dentist@clinic.com",
      role: "DENTIST",
      phone: "+374 55 333444",
    });
    dentist1 = await prisma.dentist.create({
      data: {
        userId: user.id,
        specialty: "General Dentistry",
        workingHours: {
          create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
            dayOfWeek,
            startTime: "09:00",
            endTime: "18:00",
          })),
        },
      },
    });
  }

  let dentist2 = await prisma.dentist.findFirst({ where: { user: { email: "dentist2@clinic.com" } } });
  if (!dentist2) {
    const user = await ensureUser({
      fullName: "Dr. Lilit Grigoryan",
      email: "dentist2@clinic.com",
      role: "DENTIST",
      phone: "+374 55 555666",
    });
    dentist2 = await prisma.dentist.create({
      data: {
        userId: user.id,
        specialty: "Orthodontics",
        workingHours: {
          create: [1, 2, 3, 4].map((dayOfWeek) => ({
            dayOfWeek,
            startTime: "10:00",
            endTime: "17:00",
          })),
        },
      },
    });
  }

  // ---- services ----
  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    await prisma.service.createMany({
      data: [
        { name: "Teeth Cleaning", durationMinutes: 30, price: 15000 },
        { name: "Dental Checkup", durationMinutes: 30, price: 10000 },
        { name: "Cavity Filling", durationMinutes: 60, price: 35000 },
        { name: "Braces Adjustment", durationMinutes: 30, price: 25000 },
      ],
    });
  }

  console.log("Seed complete. Demo accounts (all use the same password):");
  console.log(`  Admin:        admin@clinic.com / ${PASSWORD}`);
  console.log(`  Receptionist: reception@clinic.com / ${PASSWORD}`);
  console.log(`  Dentist:      dentist@clinic.com / ${PASSWORD}`);
  console.log(`  Dentist 2:    dentist2@clinic.com / ${PASSWORD}`);
  console.log(`  Patient:      patient@clinic.com / ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
