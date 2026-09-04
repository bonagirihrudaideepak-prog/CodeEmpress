"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/ui/app-shell";
import { Loader2, Mail, MailOpen } from "lucide-react";

type MailRow = { id: string; to: string; subject: string; text: string; createdAt: string };

export default function MailboxPage() {
  const { status } = useSession();
  const [mails, setMails] = useState<MailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MailRow | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/mailbox")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setMails(d?.mailbox || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  if (status !== "authenticated") return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-accent-soft" /> Development Mailbox
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            In-app inbox for testing email flows (verification &amp; password reset) without a real SMTP server.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
          <div className="card overflow-hidden">
            <div className="border-b border-line px-4 py-3 text-sm font-semibold">
              Inbox ({mails.length})
            </div>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : mails.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">No emails yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {mails.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className="block w-full px-4 py-3 text-left hover:bg-surface-2 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{m.subject}</span>
                      <span className="text-[10px] shrink-0 text-slate-500">
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="truncate text-xs text-slate-400">to: {m.to}</div>
                  </button>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5 min-h-[200px]">
            {selected ? (
              <>
                <div className="mb-1 text-xs text-slate-400">to: {selected.to}</div>
                <h2 className="text-lg font-bold mb-3">{selected.subject}</h2>
                <div className="whitespace-pre-wrap rounded-xl border border-line bg-surface-2/40 p-4 text-sm font-mono text-slate-300">
                  {selected.text}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-500">
                <MailOpen className="h-8 w-8 mb-2" />
                <p className="text-sm">Select an email to read it.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
