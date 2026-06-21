"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import styles from "./NotificationBell.module.css";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  interview_scheduled: "📅",
  interview_updated: "✏️",
  interview_cancelled: "❌",
  candidates_uploaded: "📄",
  team_member_added: "👥",
  campaign_sent: "📧",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

export default function NotificationBell({ orgId }: { orgId: number | null }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await api.get(`/organizations/${orgId}/notifications`);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      /* silencioso — el usuario puede no tener org aún */
    }
  }, [orgId]);

  useEffect(() => {
    fetchNotifications();
    if (!orgId) return;
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications, orgId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleOpen = async () => {
    setOpen((prev) => !prev);
    if (!open && orgId) {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    }
  };

  const handleClickNotification = async (notification: Notification) => {
    if (!orgId) return;

    if (!notification.is_read) {
      try {
        await api.put(`/organizations/${orgId}/notifications/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        /* continuar navegación */
      }
    }

    setOpen(false);
    if (notification.link) router.push(notification.link);
  };

  const handleMarkAllRead = async () => {
    if (!orgId || unreadCount === 0) return;
    try {
      await api.put(`/organizations/${orgId}/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      /* silencioso */
    }
  };

  return (
    <div className={styles.wrapper} ref={panelRef}>
      <button
        className={styles.iconBtn}
        onClick={handleOpen}
        aria-label="Notificaciones"
        type="button"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Notificaciones</span>
            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={handleMarkAllRead} type="button">
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className={styles.list}>
            {loading ? (
              <div className={styles.empty}>Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🔔</span>
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`${styles.item} ${!notification.is_read ? styles.itemUnread : ""}`}
                  onClick={() => handleClickNotification(notification)}
                  type="button"
                >
                  <span className={styles.itemIcon}>
                    {TYPE_ICONS[notification.type] || "🔔"}
                  </span>
                  <div className={styles.itemBody}>
                    <span className={styles.itemTitle}>{notification.title}</span>
                    <span className={styles.itemMessage}>{notification.message}</span>
                    <span className={styles.itemTime}>{timeAgo(notification.created_at)}</span>
                  </div>
                  {!notification.is_read && <span className={styles.unreadDot} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
