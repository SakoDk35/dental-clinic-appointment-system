// src/pages/shared/SettingsPage.tsx
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { FormField } from "../../components/common/FormField";
import { PasswordField } from "../../components/common/PasswordField";
import { useAuth } from "../../hooks/useAuth";
import { getMyProfile, updateMyProfile, changeMyPassword } from "../../api/patientsApi";
import type { User } from "../../types";

export function SettingsPage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!token) return;
    getMyProfile(token)
      .then((data) => {
        setProfile(data);
        setFullName(data.fullName);
        setPhone(data.phone ?? "");
      })
      .catch((err) => setProfileError(err instanceof Error ? err.message : "Failed to load profile."))
      .finally(() => setIsLoading(false));
  }, [token]);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setProfileError(null);
    setProfileSuccess(null);
    setIsSavingProfile(true);
    try {
      const updated = await updateMyProfile(token, { fullName, phone: phone || undefined });
      setProfile(updated);
      setProfileSuccess("Profile updated.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    setIsSavingPassword(true);
    try {
      await changeMyPassword(token, currentPassword, newPassword);
      setPasswordSuccess("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <AppShell pageTitle="Settings">
      {isLoading ? (
        <p className="text-helper">Loading...</p>
      ) : (
        <div className="d-flex flex-column gap-4" style={{ maxWidth: 520 }}>
          <div className="card p-4">
            <h2 className="h5 mb-3">My Account</h2>
            {profileError && <div className="alert alert-danger py-2">{profileError}</div>}
            {profileSuccess && <div className="alert alert-success py-2">{profileSuccess}</div>}
            <form onSubmit={handleProfileSubmit} noValidate>
              <FormField id="settingsFullName" label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <FormField
                id="settingsEmail"
                label="Email"
                value={profile?.email ?? ""}
                disabled
                readOnly
                helperText="Email is used to log in and can't be changed here."
              />
              <FormField id="settingsPhone" label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          <div className="card p-4">
            <h2 className="h5 mb-3">Change Password</h2>
            {passwordError && <div className="alert alert-danger py-2">{passwordError}</div>}
            {passwordSuccess && <div className="alert alert-success py-2">{passwordSuccess}</div>}
            <form onSubmit={handlePasswordSubmit} noValidate>
              <PasswordField
                id="currentPassword"
                label="Current Password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <PasswordField
                id="newPassword"
                label="New Password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="At least 8 characters."
              />
              <button type="submit" className="btn btn-primary" disabled={isSavingPassword}>
                {isSavingPassword ? "Saving..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
