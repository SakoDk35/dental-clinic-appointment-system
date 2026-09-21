// src/pages/patient/PatientDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { StatusBadge } from "../../components/common/StatusBadge";
import { listAppointments } from "../../api/appointmentsApi";
import { useAuth } from "../../hooks/useAuth";
import type { Appointment } from "../../types";
import { getClinicToday } from "../../utils/clinicTime";

export function PatientDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const today = getClinicToday();
    setError(null);
    listAppointments(token)
      .then((data) => {
        // "Upcoming" means exactly that — exclude cancelled and past dates.
        setAppointments(data.filter((a) => a.status !== "CANCELLED" && a.appointmentDate >= today));
      })
      .catch(() => setError("Unable to load your appointments. Please try again."))
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <AppShell pageTitle="Dashboard">
      <div className="card p-4 mb-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
        <div>
          <h2 className="h2 mb-1">Welcome back, {user?.fullName.split(" ")[0]}</h2>
          <p className="text-helper mb-0">Ready to schedule your next visit?</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => navigate("/patient/book")}>
          + Book Appointment
        </button>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="card p-3">
        <h2 className="h2 mb-3">Upcoming Appointments</h2>

        {error ? null : isLoading ? (
          <p className="text-helper">Loading upcoming appointments...</p>
        ) : appointments.length === 0 ? (
          <p className="text-helper mb-0">You have no upcoming appointments. Use the button above to book one.</p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {appointments.map((a) => (
              <div
                key={a.id}
                className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center border rounded p-3"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div>
                  <div className="fw-medium">{a.service.name}</div>
                  <div className="text-helper">
                    with {a.dentist.fullName} · {a.appointmentDate} at {a.startTime}
                  </div>
                </div>
                <div className="mt-2 mt-sm-0">
                  <StatusBadge status={a.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
