// src/pages/patient/MyAppointmentsPage.tsx
import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import {
  listAppointments,
  cancelAppointment,
  getAvailableSlots,
  rescheduleAppointment,
} from "../../api/appointmentsApi";
import type { Appointment } from "../../types";
import { getClinicToday, hasClinicDateTimePassed } from "../../utils/clinicTime";

type AppointmentGroup = "UPCOMING" | "PAST" | "CANCELLED";

export function MyAppointmentsPage() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [group, setGroup] = useState<AppointmentGroup>("UPCOMING");

  function load() {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    listAppointments(token)
      .then(setAppointments)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load appointments."))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [token]);

  useEffect(() => {
    if (!successMessage) return;
    const timeoutId = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  async function handleCancel(id: number) {
    if (!token) return;
    setError(null);
    setSuccessMessage(null);
    setIsCancelling(true);
    try {
      await cancelAppointment(token, id);
      setSuccessMessage("Appointment cancelled.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel appointment.");
    } finally {
      setIsCancelling(false);
      setCancellingId(null);
    }
  }

  function belongsToGroup(appointment: Appointment, target: AppointmentGroup): boolean {
    if (target === "CANCELLED") return appointment.status === "CANCELLED";
    if (appointment.status === "CANCELLED") return false;

    const isPast = appointment.status === "COMPLETED" ||
      hasClinicDateTimePassed(appointment.appointmentDate, appointment.endTime);
    return target === "PAST" ? isPast : !isPast;
  }

  const visibleAppointments = appointments.filter((appointment) => belongsToGroup(appointment, group));
  const groupLabels: Record<AppointmentGroup, string> = {
    UPCOMING: "Upcoming",
    PAST: "Past",
    CANCELLED: "Cancelled",
  };

  return (
    <AppShell pageTitle="My Appointments">
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      {successMessage && <div className="alert alert-success py-2" role="status">{successMessage}</div>}

      <div className="btn-group mb-3" role="group" aria-label="Appointment groups">
        {(Object.keys(groupLabels) as AppointmentGroup[]).map((value) => (
          <button
            key={value}
            type="button"
            className={`btn btn-sm ${group === value ? "btn-primary" : "btn-outline-primary"}`}
            aria-pressed={group === value}
            onClick={() => setGroup(value)}
          >
            {groupLabels[value]} ({appointments.filter((appointment) => belongsToGroup(appointment, value)).length})
          </button>
        ))}
      </div>

      <div className="card">
        {isLoading ? (
          <p className="text-helper p-3 mb-0">Loading...</p>
        ) : visibleAppointments.length === 0 ? (
          <p className="text-helper p-3 mb-0">No {groupLabels[group].toLowerCase()} appointments.</p>
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
                {visibleAppointments.map((a) => (
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
                      {(a.status === "BOOKED" || a.status === "CONFIRMED") && !hasClinicDateTimePassed(a.appointmentDate, a.startTime) && (
                        <div className="d-flex flex-wrap justify-content-end gap-2">
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setReschedulingAppointment(a)}>
                            Reschedule
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setCancellingId(a.id)}
                          >
                            Cancel
                          </button>
                        </div>
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
          aria-modal="true"
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
                <button type="button" className="btn btn-danger" onClick={() => handleCancel(cancellingId)} disabled={isCancelling}>
                  {isCancelling ? "Cancelling..." : "Yes, Cancel It"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reschedulingAppointment && (
        <PatientRescheduleModal
          appointment={reschedulingAppointment}
          onClose={() => setReschedulingAppointment(null)}
          onSaved={() => {
            setReschedulingAppointment(null);
            setSuccessMessage("Appointment rescheduled.");
            load();
          }}
        />
      )}
    </AppShell>
  );
}

function PatientRescheduleModal({
  appointment,
  onClose,
  onSaved,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [date, setDate] = useState(appointment.appointmentDate);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setIsLoadingSlots(true);
    setSelectedSlot(null);
    getAvailableSlots(token, appointment.dentist.id, date, appointment.service.id)
      .then((available) => {
        const withCurrent = date === appointment.appointmentDate
          ? Array.from(new Set([...available, appointment.startTime])).sort()
          : available;
        setSlots(withCurrent);
      })
      .catch((err) => {
        setSlots([]);
        setError(err instanceof Error ? err.message : "Failed to load available times.");
      })
      .finally(() => setIsLoadingSlots(false));
  }, [token, appointment, date]);

  async function handleSubmit() {
    if (!token || !selectedSlot) {
      setError("Please select a time.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await rescheduleAppointment(token, appointment.id, {
        appointmentDate: date,
        startTime: selectedSlot,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reschedule appointment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PatientModalShell title="Reschedule Appointment" onClose={onClose}>
      <div className="modal-body">
        {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
        <p className="text-helper">
          {appointment.service.name} with {appointment.dentist.fullName}
        </p>
        <label className="form-label fw-medium" htmlFor="patientRescheduleDate">New date</label>
        <input
          id="patientRescheduleDate"
          type="date"
          className="form-control mb-3"
          min={getClinicToday()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <span className="form-label fw-medium d-block">Available times</span>
        {isLoadingSlots ? (
          <p className="text-helper">Loading available times...</p>
        ) : slots.length === 0 ? (
          <p className="text-helper">No available times for this date.</p>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                className={`btn btn-sm ${selectedSlot === slot ? "btn-primary" : "btn-outline-primary"}`}
                aria-pressed={selectedSlot === slot}
                onClick={() => setSelectedSlot(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting || !selectedSlot}>
          {isSubmitting ? "Saving..." : "Confirm New Time"}
        </button>
      </div>
    </PatientModalShell>
  );
}

function PatientModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true" style={{ backgroundColor: "rgba(15,23,42,0.4)" }} onClick={onClose}>
      <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="h5 mb-0">{title}</h2>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
