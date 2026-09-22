import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "../../hooks/useAuth";
import "./AppShell.css";

interface AppShellProps {
  pageTitle: string;
  children: ReactNode;
}

export function AppShell({ pageTitle, children }: AppShellProps) {
  const { user } = useAuth();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDesktopNavOpen, setIsDesktopNavOpen] = useState(true);

  if (!user) return null;

  return (
    <div className={`app-shell ${isDesktopNavOpen ? "app-shell-sidebar-open" : ""}`}>
      <Sidebar
        role={user.role}
        isMobileOpen={isMobileNavOpen}
        isDesktopOpen={isDesktopNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      <div className="app-shell-content">
        <Header
          pageTitle={pageTitle}
          onToggleMobileNav={() =>
            setIsMobileNavOpen((current) => !current)
          }
          onToggleDesktopNav={() =>
            setIsDesktopNavOpen((current) => !current)
          }
          isDesktopNavOpen={isDesktopNavOpen}
        />

        <main className="app-main">{children}</main>

        <footer className="app-footer">
          <div className="app-footer-inner">
            <nav className="app-footer-links" aria-label="Footer">
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/contact">Contact</Link>
            </nav>
            <span>© 2026 Dental Clinic</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
