// src/pages/dentist/MySchedulePage.tsx
import { useEffect, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import {
  listAppointments,
  completeAppointment,
  getTreatmentNote,
  addTreatmentNote,
  updateTreatmentNote,
} from "../../api/appointmentsApi";
import type { Appointment } from "../../types";
import { getClinicToday, hasClinicDateTimePassed, shiftDate } from "../../utils/clinicTime";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";

export function MySchedulePage() {
  const { token } = useAuth();
  const [date, setDate] = useState(getClinicToday());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteAppointment, setNoteAppointment] = useState<Appointment | null>(null);

  function load() {
    if (!token) return;
    setIsLoading(true);
    listAppointments(token, { date })
      .then(setAppointments)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load schedule."))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [token, date]);

  async function handleComplete(id: number) {
    if (!token) return;
    setError(null);
    try {
      await completeAppointment(token, id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark appointment completed.");
    }
  }

  return (
    <AppShell pageTitle="My Schedule">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setDate(shiftDate(date, -1))}>
          ← Prev
        </button>
        <input type="date" className="form-control" style={{ maxWidth: 170 }} value={date} onChange={(e) => setDate(e.target.value)} aria-label="Appointment date" />
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setDate(shiftDate(date, 1))}>
          Next →
        </button>
        <button type="button" className="btn btn-link btn-sm" onClick={() => setDate(getClinicToday())}>
          Today
        </button>
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
                    <div className="text-helper">{a.service.name}</div>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <StatusBadge status={a.status} />
                  {a.status !== "COMPLETED" &&
                    a.status !== "CANCELLED" &&
                    hasClinicDateTimePassed(a.appointmentDate, a.startTime) && (
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleComplete(a.id)}>
                      Mark Completed
                    </button>
                  )}
                  {a.status === "COMPLETED" && (
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setNoteAppointment(a)}>
                      Note
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {noteAppointment && (
        <TreatmentNoteModal appointment={noteAppointment} onClose={() => setNoteAppointment(null)} />
      )}
    </AppShell>
  );
}

function TreatmentNoteModal({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const { token } = useAuth();
  const [noteText, setNoteText] = useState("");
  const [noteExists, setNoteExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getTreatmentNote(token, appointment.id)
      .then((note) => {
        if (note) {
          setNoteText(note.noteText);
          setNoteExists(true);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load note."))
      .finally(() => setIsLoading(false));
  }, [token, appointment.id]);

  async function handleSave() {
    if (!token) return;
    setError(null);
    setIsSaving(true);
    try {
      if (noteExists) {
        await updateTreatmentNote(token, appointment.id, noteText);
      } else {
        await addTreatmentNote(token, appointment.id, noteText);
        setNoteExists(true);
      }
      setSuccessMessage("Note saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true" style={{ backgroundColor: "rgba(15,23,42,0.4)" }} onClick={onClose}>
      <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="h5 mb-0">Treatment Note — {appointment.patient.fullName}</h2>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}
            {successMessage && <div className="alert alert-success py-2">{successMessage}</div>}
            {isLoading ? (
              <p className="text-helper">Loading...</p>
            ) : (
              <>
                <label htmlFor="noteText" className="form-label fw-medium">
                  Note (optional)
                </label>
                <textarea
                  id="noteText"
                  className="form-control"
                  rows={5}
                  maxLength={VALIDATION_LIMITS.treatmentNote}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Cleaning performed, no cavities found, recommend follow-up in 6 months."
                />
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
