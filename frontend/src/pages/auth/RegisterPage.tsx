// src/pages/auth/RegisterPage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../api/authApi";
import { FormField } from "../../components/common/FormField";
import { PasswordField } from "../../components/common/PasswordField";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";
import { isValidPatientPhone, PATIENT_PHONE_ERROR } from "../../utils/patientPhone";
import "./LoginPage.css";

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
    if (!isValidPatientPhone(phone.trim())) errors.phone = PATIENT_PHONE_ERROR;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register({ fullName, email, password, phone: phone.trim() });
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
    <div className="login-page">
      <main className="login-shell register-shell">
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

        <section className="login-form-panel register-form-panel">
          <div className="login-form-content">
            <div className="login-mobile-brand">
              <img src="/Dental%20Clinic%20Logo.png" alt="Bright Smile Dental Clinic logo" />
              <span>Bright Smile Dental Clinic</span>
            </div>

            <div className="login-form-heading register-form-heading">
              <h1>Create Account</h1>
              <p>Create your account to book appointments</p>
            </div>

            {formError && (
              <div className="alert alert-danger py-2" role="alert">
                {formError}
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit} noValidate>
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
                label="Phone Number *"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                maxLength={VALIDATION_LIMITS.phone}
                onChange={(e) => setPhone(e.target.value)}
                error={fieldErrors.phone}
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

              <button type="submit" className="btn btn-primary login-submit" disabled={isSubmitting}>
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

            <p className="login-register-prompt">
              Already have an account? <Link to="/login">Log In</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
