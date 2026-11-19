import { useCallback, useEffect, useState } from "react";
import "./NotificationBell.css";
import { notificationService } from "./services/api";
import { Bell, CheckCheck } from "lucide-react";

function formatDate(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Just now" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await notificationService.getAll();
      setNotifications(res.data);
    } catch (err) {
      setError("Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.warn("Failed marking all read:", err);
    }
  };

  const markSingleRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.warn("Failed marking read:", err);
    }
  };

  return (
    <div className="notification-bell-wrapper" style={{ position: "relative" }}>
      <button
        type="button"
        className="icon-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        style={{
          position: "relative",
          background: "#f0f4f1",
          border: "1px solid #d8e2da",
          borderRadius: "8px",
          width: "38px",
          height: "38px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#263b31",
          cursor: "pointer",
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#dc2626",
              color: "#ffffff",
              borderRadius: "10px",
              padding: "1px 6px",
              fontSize: "10px",
              fontWeight: "700",
              border: "2px solid #ffffff",
              lineHeight: 1.2,
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="notification-dropdown"
          style={{
            position: "absolute",
            top: "46px",
            right: 0,
            width: "320px",
            maxWidth: "calc(100vw - 32px)",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e1ece3",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #edf2ee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: "700", fontSize: "14px", color: "#263b31" }}>
              Notifications ({unreadCount} new)
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#1b7a43",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: 0,
                }}
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "20px", textAlign: "center", fontSize: "13px", color: "#61776b" }}>
                Loading updates...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", fontSize: "13px", color: "#61776b" }}>
                No notifications right now
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markSingleRead(item.id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f2f5f2",
                    background: item.read ? "#ffffff" : "#f5fbf7",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
                    <div style={{ fontWeight: item.read ? "600" : "700", fontSize: "13px", color: "#263b31" }}>
                      {item.title}
                    </div>
                    <span style={{ fontSize: "11px", color: "#8a9d92" }}>{formatDate(item.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#4f6759", lineHeight: 1.4 }}>{item.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
