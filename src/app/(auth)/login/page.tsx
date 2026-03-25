"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    // Check onboarding state and route accordingly
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_step, onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        // Existing user before onboarding was introduced — mark as complete
        await supabase.from("profiles").insert({
          user_id: user.id,
          onboarding_step: 3,
          onboarding_completed: true,
        });
        window.location.href = "/dashboard";
      } else if (profile.onboarding_completed) {
        window.location.href = "/dashboard";
      } else {
        window.location.href = `/onboarding/step-${profile.onboarding_step}`;
      }
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4">
      <div className="w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-600/10 border border-green-600/20 mb-4">
            <span className="text-green-400"><LockIcon /></span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">PortPagos</h1>
          <p className="text-green-400 text-sm font-medium mt-1">
            Get paid faster. No banks. No delays.
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Secure access to your merchant dashboard
          </p>
        </div>

        {/* Session context message */}
        {reason === "auth" && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-amber-900/30 border border-amber-700/40 text-amber-300 text-sm text-center">
            Please log in to access your dashboard.
          </div>
        )}

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">

          <h2 className="text-lg font-semibold mb-6">Sign in to your account</h2>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-400">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          {/* Signup link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link href="/signup" className="text-green-400 hover:text-green-300 font-medium transition-colors">
              Create account
            </Link>
          </p>
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-slate-600 mt-5 flex items-center justify-center gap-1.5">
          <ShieldIcon />
          Your data is encrypted and securely stored
        </p>

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
