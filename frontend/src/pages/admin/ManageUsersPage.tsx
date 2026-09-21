// src/pages/admin/ManageUsersPage.tsx
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { FormField } from "../../components/common/FormField";
import { PasswordField } from "../../components/common/PasswordField";
import { useAuth } from "../../hooks/useAuth";
import { listUsers, createStaffUser, activateUser, deactivateUser, resetUserPassword } from "../../api/usersApi";
import type { User } from "../../types";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";

export function ManageUsersPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function load() {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    // Fetch only staff roles. Dentist accounts appear here too (read-only
    // for account status/password) but are created and edited on the
    // Dentists page, since they need a specialty and working hours.
    Promise.all([
      listUsers(token, "ADMIN"),
      listUsers(token, "RECEPTIONIST"),
      listUsers(token, "DENTIST"),
    ])
      .then(([admins, receptionists, dentists]) => setUsers([...admins, ...receptionists, ...dentists]))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load users."))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [token]);

  useEffect(() => {
    if (!successMessage) return;
    const timeoutId = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  return (
    <AppShell pageTitle="Staff Accounts">
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Admin/Receptionist
        </button>
      </div>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      {successMessage && <div className="alert alert-success py-2" role="status">{successMessage}</div>}

      <div className="card">
        {isLoading ? (
          <p className="text-helper p-3 mb-0">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-helper p-3 mb-0">No staff accounts found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <span className={`badge ${u.isActive ? "text-bg-success" : "text-bg-secondary"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end flex-wrap">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setResettingUser(u)}>
                          Reset Password
                        </button>
                        {/* Prevent an Admin from locking themselves out. */}
                        {u.id !== currentUser?.id && (
                          <button
                            type="button"
                            className={`btn btn-sm ${u.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                            disabled={updatingId === u.id}
                            onClick={async () => {
                              if (!token) return;
                              if (u.isActive && !window.confirm(`Deactivate ${u.fullName}'s staff account?`)) return;
                              setError(null);
                              setUpdatingId(u.id);
                              try {
                                u.isActive ? await deactivateUser(token, u.id) : await activateUser(token, u.id);
                                setSuccessMessage(u.isActive ? "Staff account deactivated." : "Staff account activated.");
                                load();
                              } catch (err) {
                                setError(err instanceof Error ? err.message : "Failed to update staff account.");
                              } finally {
                                setUpdatingId(null);
                              }
                            }}
                          >
                            {updatingId === u.id ? "Updating..." : u.isActive ? "Deactivate" : "Activate"}
                          </button>
                        )}
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
        <CreateStaffModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); setSuccessMessage("Staff account created."); load(); }} />
      )}
      {resettingUser && (
        <ResetPasswordModal user={resettingUser} onClose={() => setResettingUser(null)} />
      )}
    </AppShell>
  );
}

function CreateStaffModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { token } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"ADMIN" | "RECEPTIONIST">("RECEPTIONIST");
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
      await createStaffUser(token, { fullName, email, password, phone: phone || undefined, role });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true" style={{ backgroundColor: "rgba(15,23,42,0.4)" }} onClick={onClose}>
      <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="h5 mb-0">New Admin/Receptionist Account</h2>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <div className="mb-3">
                <label htmlFor="staffRole" className="form-label fw-medium">Role</label>
                <select
                  id="staffRole"
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "ADMIN" | "RECEPTIONIST")}
                >
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <FormField id="staffName" label="Full Name" value={fullName} maxLength={VALIDATION_LIMITS.fullName} onChange={(e) => setFullName(e.target.value)} />
              <FormField id="staffEmail" label="Email" type="email" value={email} maxLength={VALIDATION_LIMITS.email} onChange={(e) => setEmail(e.target.value)} />
              <FormField id="staffPhone" label="Phone (optional)" type="tel" value={phone} maxLength={VALIDATION_LIMITS.phone} onChange={(e) => setPhone(e.target.value)} />
              <PasswordField id="staffPassword" label="Temporary Password" value={password} maxLength={VALIDATION_LIMITS.password} onChange={(e) => setPassword(e.target.value)} helperText="At least 8 characters." />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Account"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { token } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await resetUserPassword(token, user.id, newPassword);
      setSuccessMessage("Password reset. Share the new password with the user directly.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true" style={{ backgroundColor: "rgba(15,23,42,0.4)" }} onClick={onClose}>
      <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="h5 mb-0">Reset Password — {user.fullName}</h2>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}
              {successMessage && <div className="alert alert-success py-2">{successMessage}</div>}
              <PasswordField
                id="newStaffPassword"
                label="New Password"
                value={newPassword}
                maxLength={VALIDATION_LIMITS.password}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="At least 8 characters."
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Reset Password"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
