// src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { StatCard } from "../../components/common/StatCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { listAppointments } from "../../api/appointmentsApi";
import { getAdminStats, type AdminStats } from "../../api/dashboardApi";
import { useAuth } from "../../hooks/useAuth";
import type { Appointment } from "../../types";
import { getClinicToday } from "../../utils/clinicTime";

export function AdminDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const today = getClinicToday();
    Promise.all([listAppointments(token), getAdminStats(token)])
      .then(([appointments, adminStats]) => {
        setUpcoming(
          appointments
            .filter((a) => a.status !== "CANCELLED" && a.appointmentDate >= today)
            .slice(0, 8)
        );
        setStats(adminStats);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <AppShell pageTitle="Dashboard">
      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3">
          <StatCard label="Today's Appointments" value={String(stats?.todaysAppointments ?? 0)} icon="C" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            label="This Month's Revenue"
            value={`${(stats?.monthRevenue ?? 0).toLocaleString()} AMD`}
            icon="R"
            accentColor="var(--color-success)"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            label="Unpaid Balance"
            value={`${(stats?.unpaidTotal ?? 0).toLocaleString()} AMD`}
            icon="!"
            accentColor="var(--color-warning)"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            label="Active Patients"
            value={String(stats?.activePatients ?? 0)}
            icon="P"
            accentColor="var(--color-secondary)"
          />
        </div>
      </div>

      <div className="card p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="h2 mb-0">Upcoming Appointments</h2>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => navigate("/appointments/calendar")}>
            View Appointments
          </button>
        </div>

        {isLoading ? (
          <p className="text-helper">Loading...</p>
        ) : upcoming.length === 0 ? (
          <p className="text-helper mb-0">No upcoming appointments.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr className="text-helper">
                  <th scope="col">Patient</th>
                  <th scope="col">Dentist</th>
                  <th scope="col">Service</th>
                  <th scope="col">Time</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((a) => (
                  <tr key={a.id}>
                    <td>{a.patient.fullName}</td>
                    <td>{a.dentist.fullName}</td>
                    <td>{a.service.name}</td>
                    <td>
                      {a.appointmentDate} · {a.startTime}
                    </td>
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
