"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

function PortPagosLogo() {
  return (
    <svg width="44" height="44" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#0f172a" stroke="#1e293b" strokeWidth="1"/>
      <text x="16" y="23" fontFamily="system-ui, -apple-system, sans-serif" fontSize="19" fontWeight="700" fill="#4ade80" textAnchor="middle">P</text>
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-slate-700"}`} />
        ))}
      </div>
      <p className="text-xs text-slate-500">{labels[score]}</p>
    </div>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash — exchanging it sets the session
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // If no hash token present, the link is invalid or already used
    const hash = window.location.hash;
    if (!hash.includes("type=recovery") && !hash.includes("access_token")) {
      // Give Supabase a moment to process the hash before declaring it invalid
      setTimeout(() => {
        supabase.auth.getSession().then(({ data }) => {
          if (!data.session) setInvalidLink(true);
          else setSessionReady(true);
        });
      }, 500);
    }
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
  }

  if (invalidLink) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-600/10 border border-red-600/20 mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Link expired or already used</h2>
          <p className="text-slate-400 text-sm mb-6">Password reset links are single-use and expire after 1 hour.</p>
          <Link href="/forgot-password" className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors">
            Request a new link →
          </Link>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-600/10 border border-green-600/20 mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Password updated</h2>
          <p className="text-slate-400 text-sm mb-6">You can now sign in with your new password.</p>
          <Link href="/login" className="inline-flex items-center justify-center w-full max-w-xs py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium transition-colors">
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(circle, #4ade80 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-slate-950/60 to-slate-950" />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <PortPagosLogo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">PortPagos</h1>
          <p className="text-slate-500 text-sm mt-1">Set a new password</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-green-500 to-transparent" />
          <div className="p-8">
            <h2 className="text-lg font-semibold mb-1">Choose a new password</h2>
            <p className="text-slate-500 text-sm mb-6">Must be at least 8 characters.</p>

            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2.5 pr-10 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-green-600/60 focus:ring-1 focus:ring-green-600/40 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors" tabIndex={-1}>
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full px-3 py-2.5 pr-10 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-green-600/60 focus:ring-1 focus:ring-green-600/40 transition-colors"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors" tabIndex={-1}>
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !sessionReady}
                className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Spinner /> Updating…</>
                ) : !sessionReady ? (
                  <><Spinner /> Verifying link…</>
                ) : (
                  "Update password"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
