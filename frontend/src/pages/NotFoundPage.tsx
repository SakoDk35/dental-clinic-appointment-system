import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types";
import "./NotFoundPage.css";

const ROLE_HOME_ROUTE: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  RECEPTIONIST: "/receptionist/dashboard",
  DENTIST: "/dentist/dashboard",
  PATIENT: "/patient/dashboard",
};

export function NotFoundPage() {
  const { user } = useAuth();
  const destination = user ? ROLE_HOME_ROUTE[user.role] : "/login";

  return (
    <main className="not-found-page">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <img src="/Dental%20Clinic%20Logo.png" alt="Bright Smile Dental Clinic logo" />
        <p className="not-found-code">404</p>
        <h1 id="not-found-title">Page not found</h1>
        <p>The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
        <Link className="btn btn-primary" to={destination}>
          {user ? "Back to Dashboard" : "Back to Login"}
        </Link>
      </section>
    </main>
  );
}
