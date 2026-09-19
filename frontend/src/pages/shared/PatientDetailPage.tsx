// src/pages/shared/PatientDetailPage.tsx
import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { FormField } from "../../components/common/FormField";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { getPatient, updatePatient, activatePatient, deactivatePatient } from "../../api/patientsApi";
import { listAppointments } from "../../api/appointmentsApi";
import type { User, Appointment } from "../../types";

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);
  const { token } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token || !Number.isInteger(patientId)) return;
    setIsLoading(true);
    Promise.all([getPatient(token, patientId), listAppointments(token, { patientId })])
      .then(([p, appts]) => {
        setPatient(p);
        setFullName(p.fullName);
        setPhone(p.phone ?? "");
        setDateOfBirth(p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "");
        setAppointments(appts);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load patient."))
      .finally(() => setIsLoading(false));
  }, [token, patientId]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);
    try {
      const updated = await updatePatient(token, patientId, {
        fullName,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
      });
      setPatient(updated);
      setSuccessMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update patient.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive() {
    if (!token || !patient) return;
    setError(null);
    try {
      const updated = patient.isActive
        ? await deactivatePatient(token, patientId)
        : await activatePatient(token, patientId);
      setPatient(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update patient status.");
    }
  }

  return (
    <AppShell pageTitle="Patient Details">
      <button type="button" className="btn btn-link px-0 mb-3" onClick={() => navigate("/patients")}>
        ← Back to Patients
      </button>

      {isLoading ? (
        <p className="text-helper">Loading...</p>
      ) : !patient ? (
        <div className="alert alert-danger">{error ?? "Patient not found."}</div>
      ) : (
        <>
          <div className="card p-4 mb-4">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{ width: 48, height: 48, backgroundColor: "var(--color-primary)" }}
                  aria-hidden="true"
                >
                  {patient.fullName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2 className="h5 mb-0">{patient.fullName}</h2>
                  <span className={`badge ${patient.isActive ? "text-bg-success" : "text-bg-secondary"}`}>
                    {patient.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={`btn btn-sm ${patient.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                onClick={handleToggleActive}
              >
                {patient.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>

            {error && (
              <div className="alert alert-danger py-2" role="alert">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="alert alert-success py-2" role="status">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSave} noValidate>
              <div className="row">
                <div className="col-md-6">
                  <FormField id="fullName" label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <FormField id="email" label="Email" value={patient.email} disabled readOnly />
                </div>
                <div className="col-md-6">
                  <FormField id="phone" label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <FormField
                    id="dateOfBirth"
                    label="Date of Birth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          <div className="card">
            <div className="p-3 border-bottom">
              <h3 className="h6 mb-0">Appointment History</h3>
            </div>
            {appointments.length === 0 ? (
              <p className="text-helper p-3 mb-0">No appointments yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Dentist</th>
                      <th>Service</th>
                      <th>Status</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
