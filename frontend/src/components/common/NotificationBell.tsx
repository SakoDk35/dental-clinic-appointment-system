// src/components/common/NotificationBell.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../api/notificationsApi";
import { useAuth } from "../../hooks/useAuth";
import type { AppNotification } from "../../types";

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    getNotifications(token).then(setItems).catch(() => setItems([]));
  }, [token]);

  // Close on outside click — standard dropdown behavior.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = items.filter((n) => !n.isRead).length;

  async function handleMarkAllRead() {
    if (!token) return;
    await markAllNotificationsRead(token);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function handleItemClick(notification: AppNotification) {
    if (!token) return;
    await markNotificationRead(token, notification.id);
    setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));

    if (notification.relatedAppointmentId && user) {
      const destination = user.role === "PATIENT"
        ? "/patient/appointments"
        : user.role === "DENTIST"
          ? "/dentist/schedule"
          : "/appointments/calendar";
      setIsOpen(false);
      navigate(destination);
    }
  }

  return (
    <div className="position-relative" ref={containerRef}>
      <button
        type="button"
        className="btn notification-button position-relative"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-count position-absolute badge rounded-pill">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="card notification-menu position-absolute end-0 mt-2" role="menu">
          <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
            <h3 className="h3 mb-0">Notifications</h3>
            {unreadCount > 0 && (
              <button type="button" className="btn btn-link btn-sm p-0" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-helper p-3 mb-0">No notifications yet.</p>
          ) : (
            <ul className="list-unstyled mb-0">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className="btn w-100 text-start p-2 border-bottom rounded-0"
                    style={{ backgroundColor: n.isRead ? "transparent" : "rgba(8,117,201,0.06)" }}
                    onClick={() => handleItemClick(n)}
                  >
                    <div style={{ fontSize: 13 }}>{n.message}</div>
                    <div className="text-helper">{timeAgo(n.createdAt)}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
