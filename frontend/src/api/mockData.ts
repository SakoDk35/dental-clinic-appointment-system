// src/api/mockData.ts
// Central place for all dummy data. When the real backend is ready,
// only the files in src/api/*Api.ts need to change (swap mock lookups
// for real fetch calls) — pages/components never touch this file directly.

import type { User, Dentist, Service, Appointment, Payment, AppNotification } from "../types";

export const mockUsers: (User & { password: string })[] = [
  {
    id: 1,
    fullName: "Admin User",
    email: "admin@clinic.com",
    password: "Password123",
    role: "ADMIN",
    isActive: true,
  },
  {
    id: 2,
    fullName: "Nara Hakobyan",
    email: "reception@clinic.com",
    password: "Password123",
    role: "RECEPTIONIST",
    isActive: true,
  },
  {
    id: 3,
    fullName: "Dr. Armen Sargsyan",
    email: "dentist@clinic.com",
    password: "Password123",
    role: "DENTIST",
    isActive: true,
  },
  {
    id: 12,
    fullName: "Anna Petrosyan",
    email: "patient@clinic.com",
    password: "Password123",
    phone: "+374 55 123456",
    dateOfBirth: "1995-04-12",
    role: "PATIENT",
    isActive: true,
  },
];

export const mockDentists: Dentist[] = [
  { id: 1, userId: 3, fullName: "Dr. Armen Sargsyan", specialty: "General Dentistry", isActive: true },
  { id: 2, userId: 4, fullName: "Dr. Lilit Grigoryan", specialty: "Orthodontics", isActive: true },
];

export const mockServices: Service[] = [
  { id: 1, name: "Teeth Cleaning", durationMinutes: 30, price: 15000, isActive: true },
  { id: 2, name: "Dental Checkup", durationMinutes: 30, price: 10000, isActive: true },
  { id: 3, name: "Cavity Filling", durationMinutes: 60, price: 35000, isActive: true },
  { id: 4, name: "Braces Adjustment", durationMinutes: 30, price: 25000, isActive: true },
];

export const mockAppointments: Appointment[] = [
  {
    id: 87,
    patient: { id: 12, fullName: "Anna Petrosyan", phone: "+374 55 123456" },
    dentist: { id: 1, fullName: "Dr. Armen Sargsyan", specialty: "General Dentistry" },
    service: { id: 1, name: "Teeth Cleaning", price: 15000, durationMinutes: 30 },
    appointmentDate: "2026-09-16",
    startTime: "10:00",
    endTime: "10:30",
    status: "CONFIRMED",
    createdById: 12,
  },
  {
    id: 88,
    patient: { id: 13, fullName: "Karen Avetisyan" },
    dentist: { id: 2, fullName: "Dr. Lilit Grigoryan", specialty: "Orthodontics" },
    service: { id: 4, name: "Braces Adjustment", price: 25000, durationMinutes: 30 },
    appointmentDate: "2026-09-16",
    startTime: "11:00",
    endTime: "11:30",
    status: "BOOKED",
    createdById: 2,
  },
];

export const mockPayments: Payment[] = [
  {
    id: 1,
    appointmentId: 87,
    patientName: "Anna Petrosyan",
    serviceName: "Teeth Cleaning",
    date: "2026-09-16",
    amount: 15000,
    status: "UNPAID",
  },
];

export const mockNotifications: AppNotification[] = [
  {
    id: 1,
    type: "APPOINTMENT_CONFIRMED",
    message: "Your appointment on Sep 16 at 10:00 has been confirmed.",
    isRead: false,
    createdAt: "2026-09-15T09:00:00Z",
  },
];
