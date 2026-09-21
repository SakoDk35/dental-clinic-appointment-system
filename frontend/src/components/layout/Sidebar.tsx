import { NavLink } from "react-router-dom";
import type { Role } from "../../types";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", path: "/admin/dashboard", icon: "dashboard" },
    { label: "Appointments", path: "/appointments/calendar", icon: "calendar" },
    { label: "Patients", path: "/patients", icon: "users" },
    { label: "Dentists", path: "/admin/dentists", icon: "tooth" },
    { label: "Services", path: "/admin/services", icon: "services" },
    { label: "Staff Accounts", path: "/admin/users", icon: "staff" },
    { label: "Billing", path: "/billing", icon: "billing" },
    { label: "Settings", path: "/settings", icon: "settings" },
  ],

  RECEPTIONIST: [
    { label: "Dashboard", path: "/receptionist/dashboard", icon: "dashboard" },
    { label: "Appointments", path: "/appointments/calendar", icon: "calendar" },
    { label: "Patients", path: "/patients", icon: "users" },
    { label: "Billing", path: "/billing", icon: "billing" },
    { label: "Settings", path: "/settings", icon: "settings" },
  ],

  DENTIST: [
    { label: "Dashboard", path: "/dentist/dashboard", icon: "dashboard" },
    { label: "My Schedule", path: "/dentist/schedule", icon: "calendar" },
    { label: "Settings", path: "/settings", icon: "settings" },
  ],

  PATIENT: [
    { label: "Dashboard", path: "/patient/dashboard", icon: "dashboard" },
    { label: "Book Appointment", path: "/patient/book", icon: "plus" },
    { label: "My Appointments", path: "/patient/appointments", icon: "calendar" },
    { label: "My Profile", path: "/patient/profile", icon: "user" },
    { label: "Settings", path: "/settings", icon: "settings" },
  ],
};

function NavIcon({ name }: { name: string }) {
  let paths;

  switch (name) {
    case "dashboard":
      paths = <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>;
      break;
    case "calendar":
      paths = <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>;
      break;
    case "users":
    case "staff":
      paths = <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>;
      break;
    case "tooth":
      paths = <path d="M12 5.2C9.7 2.8 5.5 3.1 4 6.2c-1.6 3.2.6 5.7 1.4 8.5.8 2.7 1 6.3 3 6.3 1.6 0 1.7-4.8 3.6-4.8s2 4.8 3.6 4.8c2 0 2.2-3.6 3-6.3.8-2.8 3-5.3 1.4-8.5-1.5-3.1-5.7-3.4-8-1Z" />;
      break;
    case "services":
      paths = <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>;
      break;
    case "billing":
      paths = <><path d="M6 2h9l5 5v15H6z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></>;
      break;
    case "plus":
      paths = <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>;
      break;
    case "user":
      paths = <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>;
      break;
    default:
      paths = <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21h-3v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 15.7a1.7 1.7 0 0 0-1.55-1H5v-3h.45A1.7 1.7 0 0 0 7 10.7a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-2.12.06.06A1.7 1.7 0 0 0 10.7 7a1.7 1.7 0 0 0 1-1.55V5h3v.45a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1H21v3h-.09A1.7 1.7 0 0 0 19.4 15Z" /></>;
  }

  return <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths}</svg>;
}

interface SidebarProps {
  role: Role;
  isMobileOpen: boolean;
  isDesktopOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  role,
  isMobileOpen,
  isDesktopOpen,
  onCloseMobile,
}: SidebarProps) {
  const items = NAV_ITEMS[role];

  const sidebarContent = (
    <>
      <div className="sidebar-brand">
        <div className="sidebar-logo-plate">
          <img src="/Dental%20Clinic%20Logo.png" alt="Bright Smile Dental Clinic logo" />
        </div>
        <div className="sidebar-brand-copy">
          <strong>Bright Smile</strong>
          <span>Dental Clinic</span>
        </div>
      </div>

      <ul className="nav flex-column sidebar-nav flex-grow-1">
        {items.map((item) => (
          <li className="nav-item" key={item.path}>
            <NavLink
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? "active" : ""}`
              }
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      {isDesktopOpen && (
        <nav
          aria-label="Main navigation"
          className="app-sidebar app-sidebar-desktop d-none d-lg-flex flex-column position-sticky top-0 flex-shrink-0"
        >
          {sidebarContent}
        </nav>
      )}

      {/* Mobile sidebar */}
      {isMobileOpen && (
        <>
          <div
            className="app-sidebar-backdrop d-lg-none position-fixed top-0 start-0 w-100 h-100"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          <nav
            aria-label="Mobile navigation"
            className="app-sidebar app-sidebar-mobile d-flex d-lg-none flex-column position-fixed top-0 start-0"
          >
            {sidebarContent}
          </nav>
        </>
      )}
    </>
  );
}
