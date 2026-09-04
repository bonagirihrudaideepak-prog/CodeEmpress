"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Code2, Loader2, UserPlus } from "lucide-react";
import { GithubIcon } from "@/components/icons";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create account");
      setLoading(false);
      return;
    }

    // Auto-login on success
    const login = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (login?.error) {
      router.push("/login");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-foreground px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Code2 className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold">Codempress</span>
          </Link>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-slate-400 mt-2">
            Start building your AI-guided career today
          </p>
        </div>

        <div className="p-8 rounded-2xl border-2 border-line-strong bg-surface card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-3 border-2 border-line focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                placeholder="Your name"
              />
            </div>
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
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-3 border-2 border-line focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                placeholder="At least 8 characters"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Create Account
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-500">OR</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <div className="space-y-3">
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full py-3 bg-surface-3 hover:bg-surface-2 border-2 border-line rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm"
            >
              Continue with Google
            </button>
            <button
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="w-full py-3 bg-surface-3 hover:bg-surface-2 border-2 border-line rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm"
            >
              <GithubIcon className="h-4 w-4" />
              Continue with GitHub
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
