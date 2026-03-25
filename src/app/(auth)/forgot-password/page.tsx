"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-600/10 border border-green-600/20 mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Check your inbox</h2>
          <p className="text-slate-400 text-sm mb-6">
            If an account exists for <span className="text-slate-300 font-medium">{email}</span>,
            you'll receive a password reset link shortly.
          </p>
          <Link href="/login" className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors">
            ← Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">PortPagos</h1>
          <p className="text-slate-500 text-sm mt-1">Reset your password</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <h2 className="text-lg font-semibold mb-2">Forgot your password?</h2>
          <p className="text-slate-500 text-sm mb-6">
            Enter your email and we'll send you a reset link.
          </p>

          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              />
            </div>

            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            <Link href="/login" className="text-slate-400 hover:text-slate-300 transition-colors">
              ← Back to login
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}
