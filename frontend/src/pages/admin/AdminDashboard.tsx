// src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { StatCard } from "../../components/common/StatCard";
import { DashboardStatIcon } from "../../components/common/DashboardStatIcon";
import { StatusBadge } from "../../components/common/StatusBadge";
import { listAppointments } from "../../api/appointmentsApi";
import { getAdminStats, type AdminStats } from "../../api/dashboardApi";
import { useAuth } from "../../hooks/useAuth";
import type { Appointment } from "../../types";
import { getClinicToday } from "../../utils/clinicTime";

export function AdminDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const today = getClinicToday();
    setError(null);
    Promise.all([listAppointments(token), getAdminStats(token)])
      .then(([appointments, adminStats]) => {
        setUpcoming(
          appointments
            .filter((a) => a.status !== "CANCELLED" && a.appointmentDate >= today)
            .slice(0, 8)
        );
        setStats(adminStats);
      })
      .catch(() => setError("Unable to load dashboard data. Please try again."))
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <AppShell pageTitle="Dashboard">
      <div className="dashboard-page">
        <section className="dashboard-intro">
          <div>
            <p className="dashboard-eyebrow">Clinic overview</p>
            <h2>Welcome back, {user?.fullName.split(" ")[0]}!</h2>
            <p>Here&apos;s what&apos;s happening at your clinic today.</p>
          </div>
        </section>

        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        <div className="row g-3 mb-4 dashboard-stats">
          <div className="col-6 col-lg-3">
            <StatCard label="Today's Appointments" value={!stats ? "—" : String(stats.todaysAppointments)} icon={<DashboardStatIcon name="calendar" />} />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard
              label="This Month's Revenue"
              value={!stats ? "—" : `${stats.monthRevenue.toLocaleString()} AMD`}
              icon={<DashboardStatIcon name="revenue" />}
              accentColor="var(--color-success)"
            />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard
              label="Unpaid Balance"
              value={!stats ? "—" : `${stats.unpaidTotal.toLocaleString()} AMD`}
              icon={<DashboardStatIcon name="unpaid" />}
              accentColor="var(--color-warning)"
            />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard
              label="Active Patients"
              value={!stats ? "—" : String(stats.activePatients)}
              icon={<DashboardStatIcon name="patients" />}
              accentColor="var(--color-secondary)"
            />
          </div>
        </div>

        <section className="card dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-card-kicker">Schedule</p>
              <h2>Upcoming Appointments</h2>
            </div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => navigate("/appointments/calendar")}
            >
              View Appointments
            </button>
          </div>

          {error ? null : isLoading ? (
            <p className="text-helper dashboard-card-state">Loading...</p>
          ) : upcoming.length === 0 ? (
            <p className="text-helper dashboard-card-state">No upcoming appointments.</p>
          ) : (
            <div className="table-responsive dashboard-table-wrap">
              <table className="table align-middle mb-0 dashboard-table">
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
        </section>
      </div>
    </AppShell>
  );
}
