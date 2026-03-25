"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

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

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= current ? "bg-green-500" : "bg-slate-700"}`} />
      ))}
      <span className="text-xs text-slate-500 whitespace-nowrap ml-1">Step {current} of 3</span>
    </div>
  );
}

export default function SignupPage() {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!companyName.trim()) { setError("Please enter your company name."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);

    const { data: authData, error: signupError } = await supabase.auth.signUp({ email, password });

    if (signupError) { setError(signupError.message); setLoading(false); return; }

    const user = authData?.user;
    if (!user) { setError("Something went wrong. Please try again."); setLoading(false); return; }

    // Store company name locally in case of email confirmation delay
    localStorage.setItem("portpagos_company", companyName.trim());

    if (authData.session) {
      // No email confirmation — proceed immediately
      await supabase.from("profiles").insert({
        user_id: user.id,
        company_name: companyName.trim(),
        onboarding_step: 2,
        onboarding_completed: false,
      });
      window.location.href = "/onboarding/step-2";
    } else {
      // Email confirmation required
      setEmailSent(true);
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-600/10 border border-green-600/20 mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Check your inbox</h2>
          <p className="text-slate-400 text-sm mb-2">
            We sent a confirmation link to{" "}
            <span className="text-slate-300 font-medium">{email}</span>.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Click it to activate your account and complete your setup.
          </p>
          <Link href="/login" className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors">
            ← Continue to login
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
          <p className="text-green-400 text-sm font-medium mt-1">Get paid faster. No banks. No delays.</p>
          <p className="text-slate-500 text-sm mt-1">Create your account — takes 2 minutes</p>
        </div>

        <StepBar current={1} />

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <h2 className="text-lg font-semibold mb-1">Create your account</h2>
          <p className="text-slate-500 text-sm mb-6">Start receiving payments in minutes.</p>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Company name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Logistics Ltd."
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Work email</label>
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

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors" tabIndex={-1}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium transition-colors">
              {loading ? "Creating account..." : "Create account →"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">Log in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-5 flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Your data is encrypted and securely stored
        </p>
      </div>
    </main>
  );
}
