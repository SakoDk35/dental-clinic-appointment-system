// src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ProtectedRoute } from "./ProtectedRoute";

import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { ReceptionistDashboard } from "../pages/receptionist/ReceptionistDashboard";
import { DentistDashboard } from "../pages/dentist/DentistDashboard";
import { PatientDashboard } from "../pages/patient/PatientDashboard";

import { ManageDentistsPage } from "../pages/admin/ManageDentistsPage";
import { ManageServicesPage } from "../pages/admin/ManageServicesPage";
import { ManageUsersPage } from "../pages/admin/ManageUsersPage";

import { PatientsListPage } from "../pages/shared/PatientsListPage";
import { PatientDetailPage } from "../pages/shared/PatientDetailPage";
import { AppointmentsAgendaPage } from "../pages/shared/AppointmentsAgendaPage";
import { BillingPage } from "../pages/shared/BillingPage";
import { SettingsPage } from "../pages/shared/SettingsPage";

import { MySchedulePage } from "../pages/dentist/MySchedulePage";

import { BookAppointmentPage } from "../pages/patient/BookAppointmentPage";
import { MyAppointmentsPage } from "../pages/patient/MyAppointmentsPage";
import { MyProfilePage } from "../pages/patient/MyProfilePage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receptionist/dashboard"
        element={
          <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
            <ReceptionistDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dentist/dashboard"
        element={
          <ProtectedRoute allowedRoles={["DENTIST"]}>
            <DentistDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/appointments/calendar"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "RECEPTIONIST"]}>
            <AppointmentsAgendaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/book"
        element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <BookAppointmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "RECEPTIONIST"]}>
            <PatientsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "RECEPTIONIST"]}>
            <PatientDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "RECEPTIONIST"]}>
            <BillingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "RECEPTIONIST", "DENTIST", "PATIENT"]}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dentist/schedule"
        element={
          <ProtectedRoute allowedRoles={["DENTIST"]}>
            <MySchedulePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dentists"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <ManageDentistsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/services"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <ManageServicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <ManageUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/appointments"
        element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <MyAppointmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <MyProfilePage />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
