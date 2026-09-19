// src/components/common/StatCard.tsx
interface StatCardProps {
  label: string;
  value: string;
  icon: string; // short text/emoji shown in the icon circle — no icon library dependency needed for MVP
  accentColor?: string;
}

export function StatCard({ label, value, icon, accentColor = "var(--color-primary)" }: StatCardProps) {
  return (
    <div className="card p-3 h-100">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="h1 mb-1" style={{ fontSize: "28px" }}>
            {value}
          </div>
          <div className="text-helper mb-0">{label}</div>
        </div>
        <div
          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 40, height: 40, backgroundColor: `${accentColor}1F` }}
          aria-hidden="true"
        >
          <span style={{ color: accentColor, fontWeight: 600 }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
