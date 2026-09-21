// src/pages/auth/LoginPage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { FormField } from "../../components/common/FormField";
import { PasswordField } from "../../components/common/PasswordField";
import type { Role } from "../../types";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";
import "./LoginPage.css";

// Where each role lands after a successful login — mirrors the approved
// navigation flow ("On success: redirect based on role...").
const ROLE_HOME_ROUTE: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  RECEPTIONIST: "/receptionist/dashboard",
  DENTIST: "/dentist/dashboard",
  PATIENT: "/patient/dashboard",
};

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginPage() {
  const { login, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Set by RegisterPage after a successful sign-up.
  const justRegistered = (location.state as { justRegistered?: boolean } | null)?.justRegistered;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const user = await login({ email, password });
      navigate(ROLE_HOME_ROUTE[user.role], { replace: true });
    } catch {
      // authError from context already holds the generic, security-conscious
      // message ("Invalid email or password") — nothing else to do here.
    }
  }

  return (
    <div className="login-page">
      <main className="login-shell">
        <section className="login-brand-panel" aria-label="Bright Smile Dental Clinic">
          <div className="login-brand-orb login-brand-orb-top" aria-hidden="true" />
          <div className="login-brand-orb login-brand-orb-bottom" aria-hidden="true" />

          <div className="login-brand-identity">
            <div className="login-logo-plate">
              <img
                src="/Dental%20Clinic%20Logo.png"
                alt="Bright Smile Dental Clinic logo"
                className="login-brand-logo"
              />
            </div>
            <p className="login-clinic-name">Bright Smile Dental Clinic</p>
            <p className="login-clinic-tagline">
              <span>Healthy Smiles</span>
              <span>Brighter Lives</span>
            </p>
          </div>

          <div className="login-brand-message">
            <div className="login-brand-rule" aria-hidden="true" />
            <h2>
              Your Smile,
              <br />
              Our Priority
            </h2>
            <p>
              Professional care for a
              <br />
              healthier, brighter tomorrow.
            </p>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-form-content">
            <div className="login-mobile-brand">
              <img src="/Dental%20Clinic%20Logo.png" alt="Bright Smile Dental Clinic logo" />
              <span>Bright Smile Dental Clinic</span>
            </div>

            <div className="login-form-heading">
              <h1>Welcome Back</h1>
              <p>Sign in to your account</p>
            </div>

            {justRegistered && (
              <div className="alert alert-success py-2" role="status">
                Account created. Please log in with your new credentials.
              </div>
            )}

            {authError && (
              <div className="alert alert-danger py-2" role="alert">
                {authError}
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <FormField
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                maxLength={VALIDATION_LIMITS.email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email}
              />
              <PasswordField
                id="password"
                label="Password"
                autoComplete="current-password"
                value={password}
                maxLength={VALIDATION_LIMITS.password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password}
              />

              <button type="submit" className="btn btn-primary login-submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            <p className="login-register-prompt">
              Don&apos;t have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
