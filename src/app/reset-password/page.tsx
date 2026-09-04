"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Code2, Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset");
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <p className="font-semibold">Password updated!</p>
        <p className="text-sm text-slate-400 mt-2">You can now log in with your new password.</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition"
        >
          Go to login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!token && (
        <p className="text-sm text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
          This reset link is missing its token. Please use the full link from your email.
        </p>
      )}
      <div>
        <label className="block text-sm text-slate-300 mb-2">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2.5 rounded-lg bg-surface-3 border-2 border-line focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-2">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2.5 rounded-lg bg-surface-3 border-2 border-line focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !token}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-semibold transition flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Set new password
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center text-foreground px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Code2 className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold">Codempress</span>
          </Link>
          <h1 className="text-2xl font-bold">Set a new password</h1>
          <p className="text-slate-400 mt-2">Choose a strong password to continue</p>
        </div>
        <div className="p-8 rounded-2xl border-2 border-line-strong bg-surface card">
          <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin mx-auto" />}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
