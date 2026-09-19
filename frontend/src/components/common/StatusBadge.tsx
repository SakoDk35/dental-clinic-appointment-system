// src/components/common/StatusBadge.tsx
import type { AppointmentStatus, PaymentStatus } from "../../types";

type Status = AppointmentStatus | PaymentStatus;

const STATUS_LABEL: Record<Status, string> = {
  BOOKED: "Booked",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  UNPAID: "Unpaid",
  PAID: "Paid",
};

// Maps each status to the CSS class defined in theme.css, so color
// meaning stays consistent everywhere a status appears in the app.
const STATUS_CLASS: Record<Status, string> = {
  BOOKED: "badge-status-booked",
  CONFIRMED: "badge-status-confirmed",
  COMPLETED: "badge-status-completed",
  CANCELLED: "badge-status-cancelled",
  UNPAID: "badge-status-unpaid",
  PAID: "badge-status-paid",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge-status ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}
