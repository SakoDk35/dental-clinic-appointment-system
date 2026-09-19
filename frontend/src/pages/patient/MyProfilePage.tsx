// src/pages/patient/MyProfilePage.tsx
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { FormField } from "../../components/common/FormField";
import { useAuth } from "../../hooks/useAuth";
import { getMyProfile, updateMyProfile } from "../../api/patientsApi";
import type { User } from "../../types";

export function MyProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getMyProfile(token)
      .then((data) => {
        setProfile(data);
        setFullName(data.fullName);
        setPhone(data.phone ?? "");
        setDateOfBirth(data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile."))
      .finally(() => setIsLoading(false));
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);
    try {
      const updated = await updateMyProfile(token, {
        fullName,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
      });
      setProfile(updated);
      setSuccessMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell pageTitle="My Profile">
      {isLoading ? (
        <p className="text-helper">Loading...</p>
      ) : (
        <div className="card p-4" style={{ maxWidth: 520 }}>
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

          <form onSubmit={handleSubmit} noValidate>
            <FormField id="fullName" label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />

            <FormField
              id="email"
              label="Email"
              value={profile?.email ?? ""}
              disabled
              readOnly
              helperText="Email is used to log in and can't be changed here."
            />

            <FormField
              id="phone"
              label="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <FormField
              id="dateOfBirth"
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />

            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}
    </AppShell>
  );
}
