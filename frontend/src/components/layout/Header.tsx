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
    <header className="app-header">
      <div className="app-header-title-group">
        {/* Mobile navigation button */}
        <button
          type="button"
          className="btn app-nav-toggle d-lg-none"
          onClick={onToggleMobileNav}
          aria-label="Toggle navigation menu"
        >
          <span aria-hidden="true">☰</span>
        </button>

        {/* Desktop sidebar button */}
        <button
          type="button"
          className="btn app-nav-toggle d-none d-lg-inline-flex"
          onClick={onToggleDesktopNav}
          aria-label={isDesktopNavOpen ? "Hide sidebar" : "Show sidebar"}
          aria-expanded={isDesktopNavOpen}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <h1 className="app-header-title">{pageTitle}</h1>
      </div>

      <div className="app-header-actions">
        <NotificationBell />

        <div className="position-relative" ref={menuRef}>
          <button
            type="button"
            className="btn app-user-button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <div className="app-user-avatar" aria-hidden="true">
              {initials}
            </div>
            <span className="app-user-copy d-none d-md-flex">
              <span className="app-user-name">{user?.fullName}</span>
              <span className="app-user-role">{user && ROLE_LABEL[user.role]}</span>
            </span>
            <span className="app-user-chevron d-none d-md-inline" aria-hidden="true">⌄</span>
          </button>

          {menuOpen && (
            <div className="card app-user-menu position-absolute end-0 mt-2" role="menu">
              <button
                type="button"
                className="btn app-user-menu-item"
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
                className="btn app-user-menu-item app-user-menu-danger"
                role="menuitem"
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
