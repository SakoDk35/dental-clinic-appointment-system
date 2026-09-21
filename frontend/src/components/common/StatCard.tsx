// src/components/common/StatCard.tsx
import type { CSSProperties, ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accentColor?: string;
}

export function StatCard({ label, value, icon, accentColor = "var(--color-primary)" }: StatCardProps) {
  return (
    <div className="card stat-card h-100" style={{ "--stat-accent": accentColor } as CSSProperties}>
      <div className="stat-card-layout">
        <div className="stat-card-copy">
          <div className="stat-card-value">{value}</div>
          <div className="stat-card-label">{label}</div>
        </div>
        <div className="stat-card-icon" aria-hidden="true">
          {icon}
        </div>
      </div>
    </div>
  );
}
