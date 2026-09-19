import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "../../hooks/useAuth";

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
    <div className="d-flex">
      <Sidebar
        role={user.role}
        isMobileOpen={isMobileNavOpen}
        isDesktopOpen={isDesktopNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      <div className="flex-grow-1" style={{ minWidth: 0 }}>
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

        <main
          className="p-3 p-md-4"
          style={{
            maxWidth: isDesktopNavOpen ? 1280 : "none",
            margin: "0 auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}