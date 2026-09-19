// src/pages/auth/LoginPage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { FormField } from "../../components/common/FormField";
import { PasswordField } from "../../components/common/PasswordField";
import type { Role } from "../../types";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";

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
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh", padding: "16px" }}
    >
      <div className="card p-4" style={{ width: "100%", maxWidth: "400px" }}>
        <div className="text-center mb-4">
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
            style={{ width: 48, height: 48, backgroundColor: "var(--color-primary)" }}
            aria-hidden="true"
          >
            <span className="text-white fw-bold">DC</span>
          </div>
          <h1 className="h4 mb-0">Bright Smile Dental Clinic</h1>
        </div>

        <h2 className="h2 mb-3">Welcome back</h2>

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

        <form onSubmit={handleSubmit} noValidate>
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

          <button type="submit" className="btn btn-primary w-100 mt-2" disabled={isLoading}>
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

        <p className="text-center text-helper mt-3 mb-0">
          Don&apos;t have an account?{" "}
          <Link to="/register" style={{ color: "var(--color-primary)" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
