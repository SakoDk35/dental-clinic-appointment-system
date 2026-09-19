import { NavLink } from "react-router-dom";
import type { Role } from "../../types";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", path: "/admin/dashboard", icon: "D" },
    { label: "Appointments", path: "/appointments/calendar", icon: "C" },
    { label: "Patients", path: "/patients", icon: "P" },
    { label: "Dentists", path: "/admin/dentists", icon: "T" },
    { label: "Services", path: "/admin/services", icon: "S" },
    { label: "Staff Accounts", path: "/admin/users", icon: "A" },
    { label: "Billing", path: "/billing", icon: "B" },
    { label: "Settings", path: "/settings", icon: "G" },
  ],

  RECEPTIONIST: [
    { label: "Dashboard", path: "/receptionist/dashboard", icon: "D" },
    { label: "Appointments", path: "/appointments/calendar", icon: "C" },
    { label: "Patients", path: "/patients", icon: "P" },
    { label: "Billing", path: "/billing", icon: "B" },
    { label: "Settings", path: "/settings", icon: "G" },
  ],

  DENTIST: [
    { label: "Dashboard", path: "/dentist/dashboard", icon: "D" },
    { label: "My Schedule", path: "/dentist/schedule", icon: "C" },
    { label: "Settings", path: "/settings", icon: "G" },
  ],

  PATIENT: [
    { label: "Dashboard", path: "/patient/dashboard", icon: "D" },
    { label: "Book Appointment", path: "/patient/book", icon: "+" },
    { label: "My Appointments", path: "/patient/appointments", icon: "C" },
    { label: "My Profile", path: "/patient/profile", icon: "U" },
    { label: "Settings", path: "/settings", icon: "G" },
  ],
};

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
      <div className="p-3 border-bottom d-flex align-items-center gap-2">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: 32,
            height: 32,
            backgroundColor: "var(--color-primary)",
          }}
          aria-hidden="true"
        >
          <span className="text-white fw-bold" style={{ fontSize: 13 }}>
            DC
          </span>
        </div>

        <span className="fw-semibold">Bright Smile</span>
      </div>

      <ul className="nav flex-column p-2 flex-grow-1">
        {items.map((item) => (
          <li className="nav-item" key={item.path}>
            <NavLink
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-2 rounded mb-1 ${isActive ? "fw-semibold" : ""
                }`
              }
              style={({ isActive }) => ({
                color: isActive
                  ? "var(--color-primary)"
                  : "var(--color-text-secondary)",
                backgroundColor: isActive
                  ? "rgba(15,118,110,0.08)"
                  : "transparent",
                borderLeft: isActive
                  ? "3px solid var(--color-primary)"
                  : "3px solid transparent",
                paddingLeft: "12px",
              })}
            >
              <span
                className="d-inline-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 20,
                  height: 20,
                  fontSize: 12,
                }}
                aria-hidden="true"
              >
                {item.icon}
              </span>

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
          className="d-none d-lg-flex flex-column position-sticky top-0 flex-shrink-0"
          style={{
            width: 240,
            height: "100vh",
            backgroundColor: "var(--color-surface)",
            borderRight: "1px solid var(--color-border)",
            overflowY: "auto",
          }}
        >
          {sidebarContent}
        </nav>
      )}

      {/* Mobile sidebar */}
      {isMobileOpen && (
        <>
          <div
            className="d-lg-none position-fixed top-0 start-0 w-100 h-100"
            style={{
              backgroundColor: "rgba(15,23,42,0.4)",
              zIndex: 1040,
            }}
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          <nav
            aria-label="Mobile navigation"
            className="d-flex d-lg-none flex-column position-fixed top-0 start-0"
            style={{
              width: 240,
              height: "100vh",
              backgroundColor: "var(--color-surface)",
              borderRight: "1px solid var(--color-border)",
              zIndex: 1050,
              overflowY: "auto",
            }}
          >
            {sidebarContent}
          </nav>
        </>
      )}
    </>
  );
}