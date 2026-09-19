// src/pages/dentist/DentistDashboard.tsx
import { useEffect, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { StatusBadge } from "../../components/common/StatusBadge";
import { listAppointments } from "../../api/appointmentsApi";
import { useAuth } from "../../hooks/useAuth";
import type { Appointment } from "../../types";
import { getClinicToday } from "../../utils/clinicTime";

export function DentistDashboard() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    // No dentistId needed — the backend resolves "my own appointments"
    // from the JWT for a DENTIST role automatically.
    const today = getClinicToday();
    listAppointments(token, { date: today }).then((data) => {
      setAppointments(data);
      setIsLoading(false);
    });
  }, [token]);

  return (
    <AppShell pageTitle="Dashboard">
      <h2 className="h2 mb-3">Today's Schedule</h2>

      {isLoading ? (
        <p className="text-helper">Loading...</p>
      ) : appointments.length === 0 ? (
        <div className="card p-4 text-center">
          <p className="text-helper mb-0">No appointments scheduled for today.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {appointments.map((a) => (
            <div key={a.id} className="card p-3 d-flex flex-row align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div style={{ fontSize: 18, fontWeight: 600, minWidth: 80 }}>{a.startTime}</div>
                <div>
                  <div className="fw-medium">{a.patient.fullName}</div>
                  <div className="text-helper">{a.service.name}</div>
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
