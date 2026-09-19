// src/pages/auth/RegisterPage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../api/authApi";
import { FormField } from "../../components/common/FormField";
import { PasswordField } from "../../components/common/PasswordField";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;
}

export function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!fullName.trim()) errors.fullName = "Full name is required.";
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!password || password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register({ fullName, email, password, phone: phone || undefined });
      // No auto-login on purpose (keeps the flow simple, matches the
      // approved plan) — send them to log in with the credentials they
      // just created.
      navigate("/login", { replace: true, state: { justRegistered: true } });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh", padding: "16px" }}>
      <div className="card p-4" style={{ width: "100%", maxWidth: "440px" }}>
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

        <h2 className="h2 mb-3">Create your account</h2>

        {formError && (
          <div className="alert alert-danger py-2" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            id="fullName"
            label="Full Name"
            autoComplete="name"
            value={fullName}
            maxLength={VALIDATION_LIMITS.fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={fieldErrors.fullName}
          />
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
          <FormField
            id="phone"
            label="Phone (optional)"
            type="tel"
            autoComplete="tel"
            value={phone}
            maxLength={VALIDATION_LIMITS.phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <PasswordField
            id="password"
            label="Password"
            autoComplete="new-password"
            value={password}
            maxLength={VALIDATION_LIMITS.password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            helperText={!fieldErrors.password ? "At least 8 characters." : undefined}
          />

          <button type="submit" className="btn btn-primary w-100 mt-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-helper mt-3 mb-0">
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--color-primary)" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
