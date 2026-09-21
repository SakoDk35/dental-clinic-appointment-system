import { useState, type ReactNode } from "react";
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
      </div>
    </div>
  );
}
