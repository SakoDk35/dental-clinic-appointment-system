type DashboardStatIconName =
  | "calendar"
  | "calendarClock"
  | "appointmentPending"
  | "revenue"
  | "wallet"
  | "unpaid"
  | "paid"
  | "patients";

export function DashboardStatIcon({ name }: { name: DashboardStatIconName }) {
  let paths;

  switch (name) {
    case "calendar":
      paths = <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>;
      break;
    case "calendarClock":
      paths = <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><circle cx="12" cy="15.5" r="3" /><path d="M12 14v1.5l1 1" /></>;
      break;
    case "appointmentPending":
      paths = <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M12 13v3M12 18h.01" /></>;
      break;
    case "revenue":
      paths = <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" /></>;
      break;
    case "wallet":
      paths = <><path d="M4 7V5a2 2 0 0 1 2-2h12M4 7h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2" /><path d="M21 12h-5a2 2 0 0 0 0 4h5M17 14h.01" /></>;
      break;
    case "unpaid":
      paths = <><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></>;
      break;
    case "paid":
      paths = <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>;
      break;
    case "patients":
      paths = <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>;
      break;
  }

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths}
    </svg>
  );
}
