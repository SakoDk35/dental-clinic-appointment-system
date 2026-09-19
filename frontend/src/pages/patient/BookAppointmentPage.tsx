// src/pages/patient/BookAppointmentPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { AppointmentForm } from "../../components/appointments/AppointmentForm";
import type { Appointment } from "../../types";

export function BookAppointmentPage() {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);

  return (
    <AppShell pageTitle="Book Appointment">
      <div className="card p-4" style={{ maxWidth: 560 }}>
        {confirmed ? (
          <div>
            <div className="alert alert-success" role="status">
              Appointment booked for {confirmed.appointmentDate} at {confirmed.startTime} with{" "}
              {confirmed.dentist.fullName}.
            </div>
            <button type="button" className="btn btn-primary" onClick={() => navigate("/patient/appointments")}>
              View My Appointments
            </button>
          </div>
        ) : (
          <AppointmentForm showPatientSelector={false} onBooked={setConfirmed} />
        )}
      </div>
    </AppShell>
  );
}
