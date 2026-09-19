// src/pages/shared/PatientsListPage.tsx
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { FormField } from "../../components/common/FormField";
import { PasswordField } from "../../components/common/PasswordField";
import { useAuth } from "../../hooks/useAuth";
import { listPatients, createPatient } from "../../api/patientsApi";
import type { User } from "../../types";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";

export function PatientsListPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  function load(searchTerm?: string) {
    if (!token) return;
    setIsLoading(true);
    listPatients(token, searchTerm)
      .then(setPatients)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load patients."))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    load(search.trim() || undefined);
  }

  return (
    <AppShell pageTitle="Patients">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <form onSubmit={handleSearchSubmit} className="d-flex gap-2" style={{ maxWidth: 360, width: "100%" }}>
          <input
            type="search"
            className="form-control"
            placeholder="Search by name or email"
            aria-label="Search patients"
            value={search}
            maxLength={VALIDATION_LIMITS.email}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-outline-secondary">
            Search
          </button>
        </form>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Patient
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
        ) : patients.length === 0 ? (
          <p className="text-helper p-3 mb-0">No patients found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>{p.fullName}</td>
                    <td>{p.email}</td>
                    <td>{p.phone ?? "—"}</td>
                    <td>
                      <span className={`badge ${p.isActive ? "text-bg-success" : "text-bg-secondary"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-end">
                      <Link to={`/patients/${p.id}`} className="btn btn-sm btn-outline-secondary">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePatientModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(patient) => {
            setShowCreateModal(false);
            navigate(`/patients/${patient.id}`);
          }}
        />
      )}
    </AppShell>
  );
}

function CreatePatientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (patient: User) => void;
}) {
  const { token } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);

    if (!fullName.trim() || !email.trim() || password.length < 8) {
      setError("Full name, a valid email, and a password of at least 8 characters are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createPatient(token, { fullName, email, password, phone: phone || undefined });
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create patient.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      role="dialog"
      style={{ backgroundColor: "rgba(15,23,42,0.4)" }}
      onClick={onClose}
    >
      <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="h5 mb-0">New Patient</h2>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger py-2" role="alert">
                  {error}
                </div>
              )}
              <FormField id="newPatientName" label="Full Name" value={fullName} maxLength={VALIDATION_LIMITS.fullName} onChange={(e) => setFullName(e.target.value)} />
              <FormField id="newPatientEmail" label="Email" type="email" value={email} maxLength={VALIDATION_LIMITS.email} onChange={(e) => setEmail(e.target.value)} />
              <FormField id="newPatientPhone" label="Phone (optional)" type="tel" value={phone} maxLength={VALIDATION_LIMITS.phone} onChange={(e) => setPhone(e.target.value)} />
              <PasswordField
                id="newPatientPassword"
                label="Temporary Password"
                value={password}
                maxLength={VALIDATION_LIMITS.password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="At least 8 characters. Share this with the patient directly."
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Patient"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
