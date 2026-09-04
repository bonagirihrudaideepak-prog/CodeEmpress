"use client";

import { useState } from "react";
import Link from "next/link";
import { Code2, Loader2, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-foreground px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Code2 className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold">Codempress</span>
          </Link>
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="text-slate-400 mt-2">We&apos;ll email you a reset link</p>
        </div>

        <div className="p-8 rounded-2xl border-2 border-line-strong bg-surface card">
          {sent ? (
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="font-semibold">Check your inbox</p>
              <p className="text-sm text-slate-400 mt-2">
                If an account exists for <b>{email}</b>, we&apos;ve sent a link to reset your password.
              </p>
              <Link href="/login" className="mt-6 inline-block text-sm text-blue-400 hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-3 border-2 border-line focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  placeholder="you@example.com"
                />
              </div>
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Send reset link
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Remembered it?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
