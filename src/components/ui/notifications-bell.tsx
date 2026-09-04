"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Notif = { id: string; title: string; message: string; link: string | null; isRead: boolean; createdAt: string; type?: string };

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const d = await res.json();
        // Respect the user's notification preferences.
        try {
          const pr = await fetch("/api/notifications/preferences").then((r) => (r.ok ? r.json() : null));
          const prefs = pr?.prefs || {};
          const enabled: Record<string, boolean> = {
            ACHIEVEMENT: prefs.achievements ?? true,
            COURSE_UPDATE: prefs.careerUpdates ?? true,
            ROADMAP_READY: prefs.careerUpdates ?? true,
            STREAK_REMINDER: prefs.streakReminders ?? true,
            AI_INSIGHT: prefs.aiInsights ?? true,
            SYSTEM: true,
          };
          const filtered = (d.notifications as Notif[]).filter((n) => enabled[n.type as keyof typeof enabled] !== false);
          setItems(filtered);
          setUnread(filtered.filter((n) => !n.isRead).length);
        } catch {
          setItems(d.notifications);
          setUnread(d.unread);
        }
      }
    } catch {
      /* not authed */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAll() {
    await fetch("/api/notifications/read", { method: "POST" });
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function markOne(id: string) {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      setUnread(next.filter((n) => !n.isRead).length);
      return next;
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-accent-soft hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Nothing yet.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "#"}
                  onClick={() => {
                    if (!n.isRead) markOne(n.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "block border-b border-line/60 px-4 py-3 text-sm transition hover:bg-surface-2",
                    !n.isRead && "bg-accent/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />}
                    <div className="min-w-0">
                      <div className="font-medium text-slate-100">{n.title}</div>
                      <div className="text-xs text-slate-400">{n.message}</div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
