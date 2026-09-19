// src/pages/shared/AppointmentsAgendaPage.tsx
//
// Deliberately an agenda/list view rather than a full calendar grid — the
// simplest reliable way to show a day's appointments, and it naturally
// works on mobile too without a separate layout (the approved spec asks
// for a simplified list view on mobile; using it everywhere keeps this
// screen to one implementation instead of two).

import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { StatusBadge } from "../../components/common/StatusBadge";
import { AppointmentForm } from "../../components/appointments/AppointmentForm";
import { useAuth } from "../../hooks/useAuth";
import { listDentists } from "../../api/dentistsApi";
import {
  listAppointments,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAvailableSlots,
  getTreatmentNote,
} from "../../api/appointmentsApi";
import type { Appointment, Dentist, TreatmentNote } from "../../types";
import { getClinicToday, shiftDate } from "../../utils/clinicTime";

export function AppointmentsAgendaPage() {
  const { token, user } = useAuth();
  const [date, setDate] = useState(getClinicToday());
  const [dentistFilter, setDentistFilter] = useState<number | "">("");
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [noteAppointment, setNoteAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!token) return;
    // Unfiltered on purpose: the filter dropdown below must still be able to
    // show a deactivated dentist's existing appointments. The reschedule
    // modal filters to active dentists at its own point of use.
    listDentists(token).then(setDentists).catch(() => setDentists([]));
  }, [token]);

  function load() {
    if (!token) return;
    setIsLoading(true);
    listAppointments(token, { date, dentistId: dentistFilter || undefined })
      .then(setAppointments)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load appointments."))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [token, date, dentistFilter]);

  async function handleConfirm(id: number) {
    if (!token) return;
    setError(null);
    try {
      await confirmAppointment(token, id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm appointment.");
    }
  }

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
    <AppShell pageTitle="Appointments">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setDate(shiftDate(date, -1))}>
            ← Prev
          </button>
          <input type="date" className="form-control" style={{ maxWidth: 170 }} value={date} onChange={(e) => setDate(e.target.value)} />
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setDate(shiftDate(date, 1))}>
            Next →
          </button>
          <button type="button" className="btn btn-link btn-sm" onClick={() => setDate(getClinicToday())}>
            Today
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select"
            style={{ maxWidth: 220 }}
            value={dentistFilter}
            onChange={(e) => setDentistFilter(e.target.value ? Number(e.target.value) : "")}
            aria-label="Filter by dentist"
          >
            <option value="">All Dentists</option>
            {dentists.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            + New Appointment
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-helper">Loading...</p>
      ) : appointments.length === 0 ? (
        <div className="card p-4 text-center text-helper">No appointments scheduled for this day.</div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {appointments.map((a) => (
            <div key={a.id} className="card p-3">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div className="d-flex align-items-center gap-3">
                  <span className="fw-semibold" style={{ fontSize: 18, minWidth: 64 }}>
                    {a.startTime}
                  </span>
                  <div>
                    <div className="fw-medium">{a.patient.fullName}</div>
                    <div className="text-helper">
                      {a.dentist.fullName} • {a.service.name}
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <StatusBadge status={a.status} />
                  {user?.role === "ADMIN" && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setNoteAppointment(a)}
                    >
                      View Note
                    </button>
                  )}
                  {a.status === "BOOKED" && (
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleConfirm(a.id)}>
                      Confirm
                    </button>
                  )}
                  {(a.status === "BOOKED" || a.status === "CONFIRMED") && (
                    <>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setReschedulingAppointment(a)}
                      >
                        Reschedule
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setCancellingId(a.id)}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewModal && (
        <ModalShell title="New Appointment" onClose={() => setShowNewModal(false)}>
          <div className="p-3">
            <AppointmentForm
              showPatientSelector
              onCancel={() => setShowNewModal(false)}
              onBooked={() => {
                setShowNewModal(false);
                load();
              }}
            />
          </div>
        </ModalShell>
      )}

      {reschedulingAppointment && (
        <RescheduleModal
          appointment={reschedulingAppointment}
          dentists={dentists}
          onClose={() => setReschedulingAppointment(null)}
          onSaved={() => {
            setReschedulingAppointment(null);
            load();
          }}
        />
      )}

      {cancellingId !== null && (
        <ModalShell title="Cancel Appointment" onClose={() => setCancellingId(null)}>
          <div className="modal-body">Are you sure you want to cancel this appointment?</div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setCancellingId(null)}>
              Keep Appointment
            </button>
            <button type="button" className="btn btn-danger" onClick={() => handleCancel(cancellingId)}>
              Yes, Cancel It
            </button>
          </div>
        </ModalShell>
      )}

      {noteAppointment && (
        <AdminTreatmentNoteModal appointment={noteAppointment} onClose={() => setNoteAppointment(null)} />
      )}
    </AppShell>
  );
}

function AdminTreatmentNoteModal({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const { token } = useAuth();
  const [note, setNote] = useState<TreatmentNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getTreatmentNote(token, appointment.id)
      .then(setNote)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load treatment note."))
      .finally(() => setIsLoading(false));
  }, [token, appointment.id]);

  return (
    <ModalShell title={`Treatment Note — ${appointment.patient.fullName}`} onClose={onClose}>
      <div className="modal-body">
        {isLoading ? (
          <p className="text-helper mb-0">Loading...</p>
        ) : error ? (
          <div className="alert alert-danger mb-0" role="alert">{error}</div>
        ) : note ? (
          <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{note.noteText}</p>
        ) : (
          <p className="text-helper mb-0">No treatment note has been added for this appointment.</p>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: "rgba(15,23,42,0.4)" }} onClick={onClose}>
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

function RescheduleModal({
  appointment,
  dentists,
  onClose,
  onSaved,
}: {
  appointment: Appointment;
  dentists: Dentist[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [dentistId, setDentistId] = useState(appointment.dentist.id);
  const [date, setDate] = useState(appointment.appointmentDate);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    getAvailableSlots(token, dentistId, date, appointment.service.id)
      .then((result) => {
        // The appointment's own current slot won't show as "available"
        // against itself, so add it back in as a selectable option.
        const withCurrent = dentistId === appointment.dentist.id && date === appointment.appointmentDate
          ? Array.from(new Set([...result, appointment.startTime])).sort()
          : result;
        setSlots(withCurrent);
      })
      .catch(() => setSlots([]));
  }, [token, dentistId, date, appointment]);

  async function handleSubmit() {
    if (!token || !selectedSlot) {
      setError("Please select a time.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await rescheduleAppointment(token, appointment.id, { dentistId, appointmentDate: date, startTime: selectedSlot });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reschedule appointment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell title={`Reschedule — ${appointment.patient.fullName}`} onClose={onClose}>
      <div className="modal-body">
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <div className="mb-3">
          <label className="form-label fw-medium" htmlFor="rescheduleDentist">Dentist</label>
          <select
            id="rescheduleDentist"
            className="form-select"
            value={dentistId}
            onChange={(e) => setDentistId(Number(e.target.value))}
          >
            {dentists
              .filter((d) => d.isActive)
              .map((d) => (
                <option key={d.id} value={d.id}>{d.fullName}</option>
              ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label fw-medium" htmlFor="rescheduleDate">Date</label>
          <input id="rescheduleDate" type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="mb-3">
          <span className="form-label fw-medium d-block">Available Times</span>
          {slots.length === 0 ? (
            <p className="text-helper">No available times for this selection.</p>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`btn btn-sm ${selectedSlot === slot ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save New Time"}
        </button>
      </div>
    </ModalShell>
  );
}
