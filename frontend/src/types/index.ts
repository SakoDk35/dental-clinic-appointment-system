// src/types/index.ts
// Shared types matching the approved Prisma schema / API response shapes.
// Keeping these in one file for the MVP keeps imports simple; if this file
// grows past a few hundred lines later, split by domain (user.ts, appointment.ts...).

export type Role = "ADMIN" | "RECEPTIONIST" | "DENTIST" | "PATIENT";

export type AppointmentStatus = "BOOKED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID";

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string; // ISO date string
  role: Role;
  isActive: boolean;
}

export interface Dentist {
  id: number;
  userId: number;
  fullName: string;
  email?: string;
  phone?: string;
  specialty?: string;
  isActive: boolean;
  workingHours?: WorkingHours[];
}

export interface WorkingHours {
  id: number;
  dentistId: number;
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  startTime: string; // "09:00"
  endTime: string; // "18:00"
}

export interface Service {
  id: number;
  name: string;
  durationMinutes: 30 | 60;
  price: number;
  isActive: boolean;
}

export interface Appointment {
  id: number;
  patient: { id: number; fullName: string; phone?: string };
  dentist: { id: number; fullName: string; specialty?: string };
  service: { id: number; name: string; price: number; durationMinutes: number };
  appointmentDate: string; // "2026-09-20"
  startTime: string; // "10:00"
  endTime: string; // "10:30"
  status: AppointmentStatus;
  createdById: number;
}

export interface Payment {
  id: number;
  appointmentId: number;
  patientName: string;
  serviceName: string;
  date: string;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
}

export interface TreatmentNote {
  id: number;
  appointmentId: number;
  dentistId: number;
  noteText: string;
  createdAt: string;
}

export interface AppNotification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Generic API error shape, matching the REST spec's error contract.
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
