"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const COUNTRIES = [
  "Argentina", "Australia", "Belgium", "Brazil", "Canada", "Chile", "China",
  "Colombia", "Denmark", "Egypt", "France", "Germany", "Greece", "India",
  "Indonesia", "Italy", "Japan", "Malaysia", "Mexico", "Netherlands", "Norway",
  "Panama", "Peru", "Philippines", "Portugal", "Saudi Arabia", "Singapore",
  "South Africa", "South Korea", "Spain", "Sweden", "Taiwan", "Thailand",
  "Turkey", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Vietnam",
].sort();

const BUSINESS_TYPES = [
  { value: "port_agent", label: "Port Agent", description: "Representing vessels and cargo at ports" },
  { value: "shipping_company", label: "Shipping Company", description: "Ocean or inland freight carrier" },
  { value: "freight_forwarder", label: "Freight Forwarder", description: "Coordinating cargo logistics" },
  { value: "supplier", label: "Supplier / Vendor", description: "Providing goods or services to logistics" },
  { value: "other", label: "Other", description: "Another type of business" },
];

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

export default function OnboardingStep2() {
  const [country, setCountry] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login?reason=auth"; return; }

      // Check if already completed onboarding
      const { data: profile } = await supabase
        .from("profiles").select("onboarding_step, onboarding_completed").eq("user_id", user.id).maybeSingle();

      if (profile?.onboarding_completed) { window.location.href = "/dashboard"; return; }

      // If no profile exists, create one (handles email-confirmation resume flow)
      if (!profile) {
        const savedCompany = localStorage.getItem("portpagos_company") || "";
        await supabase.from("profiles").insert({
          user_id: user.id,
          company_name: savedCompany,
          onboarding_step: 2,
          onboarding_completed: false,
        });
      }

      setChecking(false);
    }
    checkAuth();
  }, []);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!country) { setError("Please select your country."); return; }
    if (!businessType) { setError("Please select your business type."); return; }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login?reason=auth"; return; }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ country, business_type: businessType, onboarding_step: 3 })
      .eq("user_id", user.id);

    if (updateError) { setError("Something went wrong. Please try again."); setLoading(false); return; }

    window.location.href = "/onboarding/step-3";
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <p className="text-slate-500 text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">PortPagos</h1>
          <p className="text-slate-500 text-sm mt-1">Tell us about your business</p>
        </div>

        <StepBar current={2} />

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <h2 className="text-lg font-semibold mb-1">Your business</h2>
          <p className="text-slate-500 text-sm mb-6">
            This helps us tailor the experience to your industry.
          </p>

          <form onSubmit={handleContinue} className="space-y-6">

            {/* Country */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Country of operation</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              >
                <option value="">Select country...</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Business type */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-3">Business type</label>
              <div className="space-y-2">
                {BUSINESS_TYPES.map((bt) => (
                  <label
                    key={bt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      businessType === bt.value
                        ? "border-green-500/50 bg-green-900/10"
                        : "border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="businessType"
                      value={bt.value}
                      checked={businessType === bt.value}
                      onChange={() => setBusinessType(bt.value)}
                      className="mt-0.5 accent-green-500"
                    />
                    <div>
                      <p className="text-sm font-medium">{bt.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{bt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium transition-colors">
              {loading ? "Saving..." : "Continue →"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-5">
          You can update these details later in your account settings.
        </p>
      </div>
    </main>
  );
}
