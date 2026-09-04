"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Code2, Loader2, CheckCircle2, XCircle, MailCheck } from "lucide-react";
import { Suspense } from "react";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";
  const [status, setStatus] = useState<"loading" | "verified" | "error" | "missing">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("missing");
      setMessage("This verification link is missing its token.");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("verified");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      } catch {
        setStatus("error");
        setMessage("Could not reach the server");
      }
    })();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="text-center">
        <Loader2 className="h-10 w-10 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Verifying your email…</p>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="text-center">
        <CheckCircle2 className="h-14 w-14 text-green-400 mx-auto mb-4" />
        <p className="text-xl font-bold">Email verified! 🎉</p>
        <p className="text-sm text-slate-400 mt-2">Your account is now fully active.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <XCircle className="h-14 w-14 text-red-400 mx-auto mb-4" />
      <p className="text-xl font-bold">Couldn&apos;t verify</p>
      <p className="text-sm text-slate-400 mt-2">{message}</p>
      <Link href="/login" className="mt-6 inline-block text-sm text-blue-400 hover:underline">
        Back to login
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center text-foreground px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Code2 className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold">Codempress</span>
          </Link>
          <h1 className="text-2xl font-bold">Confirm your email</h1>
          <p className="text-slate-400 mt-2 flex items-center justify-center gap-1.5">
            <MailCheck className="h-4 w-4" /> Securing your account
          </p>
        </div>
        <div className="p-8 rounded-2xl border-2 border-line-strong bg-surface card">
          <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin mx-auto" />}>
            <VerifyForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
