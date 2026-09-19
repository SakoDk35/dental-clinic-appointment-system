// src/components/layout/Header.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { NotificationBell } from "../common/NotificationBell";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  RECEPTIONIST: "Receptionist",
  DENTIST: "Dentist",
  PATIENT: "Patient",
};

interface HeaderProps {
  pageTitle: string;
  onToggleMobileNav: () => void;
  onToggleDesktopNav: () => void;
  isDesktopNavOpen: boolean;
}
export function Header({
  pageTitle,
  onToggleMobileNav,
  onToggleDesktopNav,
  isDesktopNavOpen,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const initials = user?.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      className="d-flex align-items-center justify-content-between px-3"
      style={{
        height: 64,
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 1030,
      }}
    >
      <div className="d-flex align-items-center gap-2">
        {/* Mobile navigation button */}
        <button
          type="button"
          className="btn btn-link d-lg-none p-1"
          onClick={onToggleMobileNav}
          aria-label="Toggle navigation menu"
        >
          <span style={{ fontSize: 20 }} aria-hidden="true">
            ☰
          </span>
        </button>

        {/* Desktop sidebar button */}
        <button
          type="button"
          className="btn btn-link d-none d-lg-inline-flex p-1"
          onClick={onToggleDesktopNav}
          aria-label={isDesktopNavOpen ? "Hide sidebar" : "Show sidebar"}
          aria-expanded={isDesktopNavOpen}
        >
          <span style={{ fontSize: 20 }} aria-hidden="true">
            ☰
          </span>
        </button>
        <h1 className="h1 mb-0" style={{ fontSize: 20 }}>
          {pageTitle}
        </h1>
      </div>

      <div className="d-flex align-items-center gap-2">
        <NotificationBell />

        <div className="position-relative" ref={menuRef}>
          <button
            type="button"
            className="btn btn-link d-flex align-items-center gap-2 text-decoration-none"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 32, height: 32, backgroundColor: "var(--color-primary)" }}
              aria-hidden="true"
            >
              <span className="text-white" style={{ fontSize: 12, fontWeight: 600 }}>
                {initials}
              </span>
            </div>
            <span className="d-none d-md-flex flex-column text-start" style={{ lineHeight: 1.1 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>{user?.fullName}</span>
              <span className="text-helper">{user && ROLE_LABEL[user.role]}</span>
            </span>
          </button>

          {menuOpen && (
            <div
              className="card position-absolute end-0 mt-1"
              style={{ width: 180, zIndex: 1060 }}
              role="menu"
            >
              <button
                type="button"
                className="btn text-start p-2"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings");
                }}
              >
                Settings
              </button>
              <button
                type="button"
                className="btn text-start p-2"
                role="menuitem"
                style={{ color: "var(--color-danger)" }}
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
