// ── In-app notification store ─────────────────────────────────────────────
// Lightweight pub/sub for in-app notifications (not browser push).

export type NotifType = "match" | "achievement" | "friend" | "system" | "reward";

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  action?: { label: string; route: string };
}

type Listener = (notifs: AppNotification[]) => void;

const listeners = new Set<Listener>();
let notifications: AppNotification[] = loadFromStorage();

function loadFromStorage(): AppNotification[] {
  try {
    const raw = localStorage.getItem("wb_notifications");
    return raw ? JSON.parse(raw) : getDefaultNotifications();
  } catch { return getDefaultNotifications(); }
}

function getDefaultNotifications(): AppNotification[] {
  return [
    {
      id: "n1",
      type: "system",
      title: "Welcome to WordBlitz!",
      body: "Complete your first match to earn 100 XP.",
      timestamp: Date.now() - 3600_000,
      read: false,
    },
    {
      id: "n2",
      type: "reward",
      title: "Daily Reward Available",
      body: "Claim your daily login reward — +50 XP waiting!",
      timestamp: Date.now() - 1800_000,
      read: false,
    },
    {
      id: "n3",
      type: "match",
      title: "Season 1 is Live",
      body: "Neon Storm season has begun. Climb the ranks for exclusive rewards.",
      timestamp: Date.now() - 7200_000,
      read: true,
    },
  ];
}

function save() {
  try { localStorage.setItem("wb_notifications", JSON.stringify(notifications)); } catch {}
}

function emit() {
  const copy = [...notifications];
  listeners.forEach(l => l(copy));
}

export function subscribeNotifications(listener: Listener): () => void {
  listeners.add(listener);
  listener([...notifications]);
  return () => listeners.delete(listener);
}

export function pushNotification(notif: Omit<AppNotification, "id" | "timestamp" | "read">) {
  const n: AppNotification = {
    ...notif,
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    read: false,
  };
  notifications = [n, ...notifications].slice(0, 50); // keep last 50
  save();
  emit();
}

export function markAllRead() {
  notifications = notifications.map(n => ({ ...n, read: true }));
  save();
  emit();
}

export function markRead(id: string) {
  notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
  save();
  emit();
}

export function clearAll() {
  notifications = [];
  save();
  emit();
}

export function getUnreadCount(): number {
  return notifications.filter(n => !n.read).length;
}
