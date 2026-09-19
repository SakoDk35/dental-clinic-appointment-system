// src/pages/receptionist/ReceptionistDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { StatCard } from "../../components/common/StatCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { listAppointments } from "../../api/appointmentsApi";
import { useAuth } from "../../hooks/useAuth";
import type { Appointment } from "../../types";
import { getClinicToday } from "../../utils/clinicTime";

export function ReceptionistDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    listAppointments(token).then((data) => {
      setAppointments(data);
      setIsLoading(false);
    });
  }, [token]);

  const today = getClinicToday();
  const todaysAppointments = appointments.filter((a) => a.appointmentDate === today);
  const upcomingAppointments = appointments.filter((a) => a.appointmentDate > today);

  return (
    <AppShell pageTitle="Dashboard">
      {/* No revenue/financial stat cards here — Receptionist role is
          intentionally scoped to scheduling info only, per the approved
          permissions table. */}
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-4">
          <StatCard label="Today's Appointments" value={String(todaysAppointments.length)} icon="C" />
        </div>
        <div className="col-6 col-md-4">
          <StatCard
            label="Upcoming Appointments"
            value={String(upcomingAppointments.length)}
            icon="U"
            accentColor="var(--color-secondary)"
          />
        </div>
        <div className="col-6 col-md-4">
          <StatCard
            label="Booked (Unconfirmed)"
            value={String(appointments.filter((a) => a.status === "BOOKED").length)}
            icon="!"
            accentColor="var(--color-warning)"
          />
        </div>
      </div>

      <div className="card p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="h2 mb-0">Today's Schedule</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate("/appointments/calendar")}>
            + New Appointment
          </button>
        </div>

        {isLoading ? (
          <p className="text-helper">Loading...</p>
        ) : todaysAppointments.length === 0 ? (
          <p className="text-helper mb-0">No appointments scheduled for today.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr className="text-helper">
                  <th scope="col">Time</th>
                  <th scope="col">Patient</th>
                  <th scope="col">Dentist</th>
                  <th scope="col">Service</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {todaysAppointments.map((a) => (
                  <tr key={a.id}>
                    <td className="fw-medium">{a.startTime}</td>
                    <td>{a.patient.fullName}</td>
                    <td>{a.dentist.fullName}</td>
                    <td>{a.service.name}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
