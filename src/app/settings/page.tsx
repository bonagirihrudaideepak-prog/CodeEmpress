"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { AppShell } from "@/components/ui/app-shell";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { Bell, Loader2, Save } from "lucide-react";

const PREF_DEFS: { key: string; label: string; desc: string }[] = [
  { key: "achievements", label: "Achievements & badges", desc: "Get notified when you earn a badge or reach a milestone." },
  { key: "careerUpdates", label: "Career updates", desc: "Application status changes and interview reminders." },
  { key: "streakReminders", label: "Streak reminders", desc: "Nudge to keep your daily learning streak alive." },
  { key: "aiInsights", label: "AI insights", desc: "Personalized tips from your AI mentor." },
];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPrefs(d.prefs))
      .catch(() => {});
  }, []);

  async function toggle(key: string) {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next[key] }),
      });
      if (!res.ok) toast.error("Could not save preference");
    } catch {
      toast.error("Could not save preference");
    }
  }

  async function saveAll() {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs || {}),
      });
      if (res.ok) toast.success("Preferences saved");
      else toast.error("Could not save");
    } catch {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <SectionHeading title="Settings" subtitle="Manage your notification preferences." />

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent-soft" />
            <h3 className="font-semibold">Notifications</h3>
          </div>

          {!prefs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {PREF_DEFS.map((p) => (
                <div key={p.key} className="flex items-start justify-between gap-4 rounded-xl border border-line bg-surface-2/40 p-4">
                  <div>
                    <div className="text-sm font-medium text-slate-200">{p.label}</div>
                    <div className="text-xs text-slate-400">{p.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs[p.key] ?? true}
                    onChange={() => toggle(p.key)}
                    className="mt-1 h-5 w-5 accent-[#38bdf8]"
                  />
                </div>
              ))}
            </div>
          )}

          <button onClick={saveAll} disabled={saving || !prefs} className="btn btn-primary mt-6">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save preferences
          </button>
        </Card>
      </div>
    </AppShell>
  );
}
