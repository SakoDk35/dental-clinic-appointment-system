// src/pages/patient/MyAppointmentsPage.tsx
import { useEffect, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { listAppointments, cancelAppointment } from "../../api/appointmentsApi";
import type { Appointment } from "../../types";

export function MyAppointmentsPage() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  function load() {
    if (!token) return;
    setIsLoading(true);
    listAppointments(token)
      .then(setAppointments)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load appointments."))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [token]);

  async function handleCancel(id: number) {
    if (!token) return;
    setError(null);
    try {
      await cancelAppointment(token, id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel appointment.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <AppShell pageTitle="My Appointments">
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <p className="text-helper p-3 mb-0">Loading...</p>
        ) : appointments.length === 0 ? (
          <p className="text-helper p-3 mb-0">You have no appointments yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Dentist</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.appointmentDate} at {a.startTime}
                    </td>
                    <td>{a.dentist.fullName}</td>
                    <td>{a.service.name}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="text-end">
                      {(a.status === "BOOKED" || a.status === "CONFIRMED") && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setCancellingId(a.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {cancellingId !== null && (
        <div
          className="modal d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: "rgba(15,23,42,0.4)" }}
          onClick={() => setCancellingId(null)}
        >
          <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="h5 mb-0">Cancel Appointment</h2>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setCancellingId(null)} />
              </div>
              <div className="modal-body">Are you sure you want to cancel this appointment?</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setCancellingId(null)}>
                  Keep Appointment
                </button>
                <button type="button" className="btn btn-danger" onClick={() => handleCancel(cancellingId)}>
                  Yes, Cancel It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
