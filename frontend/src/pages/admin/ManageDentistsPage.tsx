// src/pages/admin/ManageDentistsPage.tsx
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { FormField } from "../../components/common/FormField";
import { PasswordField } from "../../components/common/PasswordField";
import { useAuth } from "../../hooks/useAuth";
import {
  listDentists,
  createDentist,
  updateDentist,
  activateDentist,
  deactivateDentist,
  setWorkingHours,
} from "../../api/dentistsApi";
import type { Dentist, WorkingHours } from "../../types";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ManageDentistsPage() {
  const { token } = useAuth();
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDentist, setEditingDentist] = useState<Dentist | null>(null);
  const [hoursDentist, setHoursDentist] = useState<Dentist | null>(null);

  function load() {
    if (!token) return;
    setIsLoading(true);
    listDentists(token)
      .then(setDentists)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dentists."))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [token]);

  return (
    <AppShell pageTitle="Dentists">
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Dentist
        </button>
      </div>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <p className="text-helper p-3 mb-0">Loading...</p>
        ) : dentists.length === 0 ? (
          <p className="text-helper p-3 mb-0">No dentists yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Specialty</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dentists.map((d) => (
                  <tr key={d.id}>
                    <td>{d.fullName}</td>
                    <td>{d.specialty ?? "—"}</td>
                    <td>{d.phone ?? "—"}</td>
                    <td>
                      <span className={`badge ${d.isActive ? "text-bg-success" : "text-bg-secondary"}`}>
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end flex-wrap">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditingDentist(d)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setHoursDentist(d)}>
                          Working Hours
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${d.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                          onClick={async () => {
                            if (!token) return;
                            try {
                              d.isActive ? await deactivateDentist(token, d.id) : await activateDentist(token, d.id);
                              load();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Failed to update dentist.");
                            }
                          }}
                        >
                          {d.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateDentistModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); load(); }} />
      )}
      {editingDentist && (
        <EditDentistModal
          dentist={editingDentist}
          onClose={() => setEditingDentist(null)}
          onSaved={() => { setEditingDentist(null); load(); }}
        />
      )}
      {hoursDentist && (
        <WorkingHoursModal
          dentist={hoursDentist}
          onClose={() => setHoursDentist(null)}
          onSaved={() => { setHoursDentist(null); load(); }}
        />
      )}
    </AppShell>
  );
}

function CreateDentistModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { token } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!fullName.trim() || !email.trim() || password.length < 8) {
      setError("Full name, a valid email, and a password of at least 8 characters are required.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await createDentist(token, { fullName, email, password, phone: phone || undefined, specialty: specialty || undefined });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create dentist.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell title="New Dentist" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <FormField id="dentistName" label="Full Name" value={fullName} maxLength={VALIDATION_LIMITS.fullName} onChange={(e) => setFullName(e.target.value)} />
          <FormField id="dentistEmail" label="Email" type="email" value={email} maxLength={VALIDATION_LIMITS.email} onChange={(e) => setEmail(e.target.value)} />
          <FormField id="dentistPhone" label="Phone (optional)" type="tel" value={phone} maxLength={VALIDATION_LIMITS.phone} onChange={(e) => setPhone(e.target.value)} />
          <FormField id="dentistSpecialty" label="Specialty (optional)" value={specialty} maxLength={VALIDATION_LIMITS.specialty} onChange={(e) => setSpecialty(e.target.value)} />
          <PasswordField id="dentistPassword" label="Temporary Password" value={password} maxLength={VALIDATION_LIMITS.password} onChange={(e) => setPassword(e.target.value)} helperText="At least 8 characters." />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Dentist"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditDentistModal({ dentist, onClose, onSaved }: { dentist: Dentist; onClose: () => void; onSaved: () => void }) {
  const { token } = useAuth();
  const [fullName, setFullName] = useState(dentist.fullName);
  const [phone, setPhone] = useState(dentist.phone ?? "");
  const [specialty, setSpecialty] = useState(dentist.specialty ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await updateDentist(token, dentist.id, { fullName, phone: phone || undefined, specialty: specialty || undefined });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update dentist.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell title={`Edit ${dentist.fullName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <FormField id="editDentistName" label="Full Name" value={fullName} maxLength={VALIDATION_LIMITS.fullName} onChange={(e) => setFullName(e.target.value)} />
          <FormField id="editDentistEmail" label="Email" value={dentist.email ?? ""} disabled readOnly />
          <FormField id="editDentistPhone" label="Phone" type="tel" value={phone} maxLength={VALIDATION_LIMITS.phone} onChange={(e) => setPhone(e.target.value)} />
          <FormField id="editDentistSpecialty" label="Specialty" value={specialty} maxLength={VALIDATION_LIMITS.specialty} onChange={(e) => setSpecialty(e.target.value)} />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function WorkingHoursModal({ dentist, onClose, onSaved }: { dentist: Dentist; onClose: () => void; onSaved: () => void }) {
  const { token } = useAuth();
  const [rows, setRows] = useState<Record<number, { enabled: boolean; startTime: string; endTime: string }>>(() => {
    const initial: Record<number, { enabled: boolean; startTime: string; endTime: string }> = {};
    for (let day = 0; day <= 6; day++) {
      const existing = dentist.workingHours?.find((wh) => wh.dayOfWeek === day);
      initial[day] = existing
        ? { enabled: true, startTime: existing.startTime, endTime: existing.endTime }
        : { enabled: false, startTime: "09:00", endTime: "18:00" };
    }
    return initial;
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);

    const payload: Omit<WorkingHours, "id" | "dentistId">[] = Object.entries(rows)
      .filter(([, row]) => row.enabled)
      .map(([day, row]) => ({ dayOfWeek: Number(day), startTime: row.startTime, endTime: row.endTime }));

    setIsSubmitting(true);
    try {
      await setWorkingHours(token, dentist.id, payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save working hours.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell title={`Working Hours — ${dentist.fullName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {DAY_LABELS.map((label, day) => (
            <div key={day} className="d-flex align-items-center gap-2 mb-2">
              <div className="form-check" style={{ width: 140 }}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`day-${day}`}
                  checked={rows[day].enabled}
                  onChange={(e) => setRows((prev) => ({ ...prev, [day]: { ...prev[day], enabled: e.target.checked } }))}
                />
                <label className="form-check-label" htmlFor={`day-${day}`}>{label}</label>
              </div>
              <input
                type="time"
                className="form-control"
                style={{ maxWidth: 130 }}
                disabled={!rows[day].enabled}
                value={rows[day].startTime}
                onChange={(e) => setRows((prev) => ({ ...prev, [day]: { ...prev[day], startTime: e.target.value } }))}
                aria-label={`${label} start time`}
              />
              <span>to</span>
              <input
                type="time"
                className="form-control"
                style={{ maxWidth: 130 }}
                disabled={!rows[day].enabled}
                value={rows[day].endTime}
                onChange={(e) => setRows((prev) => ({ ...prev, [day]: { ...prev[day], endTime: e.target.value } }))}
                aria-label={`${label} end time`}
              />
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Working Hours"}</button>
        </div>
      </form>
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
