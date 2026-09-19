// src/components/appointments/AppointmentForm.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { listServices } from "../../api/servicesApi";
import { listDentists } from "../../api/dentistsApi";
import { listPatients } from "../../api/patientsApi";
import { getAvailableSlots, createAppointment } from "../../api/appointmentsApi";
import type { Service, Dentist, User, Appointment } from "../../types";
import { getClinicToday } from "../../utils/clinicTime";

interface AppointmentFormProps {
  // When true, shows a patient search/select field (Receptionist/Admin
  // booking on someone's behalf). When false, the logged-in Patient is
  // implicitly the patient — matches the approved booking flow.
  showPatientSelector: boolean;
  onBooked: (appointment: Appointment) => void;
  onCancel?: () => void;
}

export function AppointmentForm({ showPatientSelector, onBooked, onCancel }: AppointmentFormProps) {
  const { token } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [serviceId, setServiceId] = useState<number | "">("");
  const [dentistId, setDentistId] = useState<number | "">("");
  const [date, setDate] = useState(getClinicToday());
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<User[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    listServices(token)
      .then((all) => setServices(all.filter((s) => s.isActive)))
      .catch(() => setServices([]));
    // Staff get inactive dentists too (the management page needs them), so
    // filter here — a deactivated dentist must never be bookable.
    listDentists(token)
      .then((all) => setDentists(all.filter((d) => d.isActive)))
      .catch(() => setDentists([]));
  }, [token]);

  useEffect(() => {
    if (!token || !dentistId || !serviceId || !date) {
      setSlots([]);
      return;
    }
    setIsLoadingSlots(true);
    setSelectedSlot(null);
    getAvailableSlots(token, Number(dentistId), date, Number(serviceId))
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setIsLoadingSlots(false));
  }, [token, dentistId, serviceId, date]);

  async function handlePatientSearch() {
    if (!token || !patientSearch.trim()) return;
    const results = await listPatients(token, patientSearch.trim());
    setPatientResults(results);
  }

  async function handleSubmit() {
    if (!token) return;
    setError(null);

    if (!dentistId || !serviceId || !date || !selectedSlot) {
      setError("Please select a service, dentist, date, and time slot.");
      return;
    }
    if (showPatientSelector && !selectedPatient) {
      setError("Please select a patient.");
      return;
    }

    setIsSubmitting(true);
    try {
      const appointment = await createAppointment(token, {
        patientId: showPatientSelector ? selectedPatient!.id : undefined,
        dentistId: Number(dentistId),
        serviceId: Number(serviceId),
        appointmentDate: date,
        startTime: selectedSlot,
      });
      onBooked(appointment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book appointment.");
      // The slot may have just been taken by someone else — refresh the list.
      if (dentistId && serviceId && date) {
        getAvailableSlots(token, Number(dentistId), date, Number(serviceId)).then(setSlots);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedService = services.find((s) => s.id === serviceId);

  return (
    <div>
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      {showPatientSelector && (
        <div className="mb-3">
          <label className="form-label fw-medium" htmlFor="patientSearch">
            Patient
          </label>
          {selectedPatient ? (
            <div className="d-flex align-items-center justify-content-between border rounded p-2">
              <span>
                {selectedPatient.fullName} ({selectedPatient.email})
              </span>
              <button type="button" className="btn btn-sm btn-link" onClick={() => setSelectedPatient(null)}>
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="d-flex gap-2">
                <input
                  id="patientSearch"
                  type="search"
                  className="form-control"
                  placeholder="Search by name or email"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handlePatientSearch())}
                />
                <button type="button" className="btn btn-outline-secondary" onClick={handlePatientSearch}>
                  Search
                </button>
              </div>
              {patientResults.length > 0 && (
                <ul className="list-group mt-2" style={{ maxHeight: 160, overflowY: "auto" }}>
                  {patientResults.map((p) => (
                    <li key={p.id} className="list-group-item list-group-item-action" style={{ cursor: "pointer" }}>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-start w-100"
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientResults([]);
                        }}
                      >
                        {p.fullName} ({p.email})
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label fw-medium" htmlFor="serviceSelect">
          Service
        </label>
        <select
          id="serviceSelect"
          className="form-select"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Select a service...</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.durationMinutes} min — {s.price.toLocaleString()} AMD
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label fw-medium" htmlFor="dentistSelect">
          Dentist
        </label>
        <select
          id="dentistSelect"
          className="form-select"
          value={dentistId}
          onChange={(e) => setDentistId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Select a dentist...</option>
          {dentists.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName}
              {d.specialty ? ` — ${d.specialty}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label fw-medium" htmlFor="dateInput">
          Date
        </label>
        <input
          id="dateInput"
          type="date"
          className="form-control"
          min={getClinicToday()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {dentistId && serviceId && date && (
        <div className="mb-3">
          <span className="form-label fw-medium d-block">Available Times</span>
          {isLoadingSlots ? (
            <p className="text-helper">Loading available times...</p>
          ) : slots.length === 0 ? (
            <p className="text-helper">No available times for this date. Try another date or dentist.</p>
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
      )}

      {selectedService && selectedSlot && (
        <div className="card p-3 mb-3" style={{ backgroundColor: "var(--color-background)" }}>
          <strong>Summary</strong>
          <div className="text-helper mt-1">
            {selectedService.name} on {date} at {selectedSlot} — {selectedService.price.toLocaleString()} AMD
          </div>
        </div>
      )}

      <div className="d-flex gap-2">
        {onCancel && (
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting || !selectedSlot}>
          {isSubmitting ? "Booking..." : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}
