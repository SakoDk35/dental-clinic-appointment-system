// src/components/common/NotificationBell.tsx
import { useEffect, useRef, useState } from "react";
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
  const { token } = useAuth();
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

  async function handleItemClick(id: number) {
    if (!token) return;
    await markNotificationRead(token, id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  return (
    <div className="position-relative" ref={containerRef}>
      <button
        type="button"
        className="btn btn-link position-relative p-2"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span style={{ fontSize: 18 }} aria-hidden="true">
          🔔
        </span>
        {unreadCount > 0 && (
          <span
            className="position-absolute badge rounded-pill"
            style={{
              top: 2,
              right: 0,
              backgroundColor: "var(--color-danger)",
              fontSize: 10,
              color: "white",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="card position-absolute end-0 mt-1"
          style={{ width: 320, maxHeight: 400, overflowY: "auto", zIndex: 1060 }}
          role="menu"
        >
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
                    style={{ backgroundColor: n.isRead ? "transparent" : "rgba(15,118,110,0.06)" }}
                    onClick={() => handleItemClick(n.id)}
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
