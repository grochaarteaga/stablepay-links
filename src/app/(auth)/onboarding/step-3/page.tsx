"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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

export default function OnboardingStep3() {
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login?reason=auth"; return; }

      const { data: profile } = await supabase
        .from("profiles").select("onboarding_step, onboarding_completed").eq("user_id", user.id).maybeSingle();

      if (profile?.onboarding_completed) { window.location.href = "/dashboard"; return; }
      if (profile && profile.onboarding_step < 3) { window.location.href = "/onboarding/step-2"; return; }

      setChecking(false);
    }
    checkAuth();
  }, []);

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    setLoading(true);
    setLoadingMessage("Creating your invoice...");

    const { data: { user, session } } = await supabase.auth.getUser().then(async (r) => ({
      data: {
        user: r.data.user,
        session: (await supabase.auth.getSession()).data.session,
      },
    }));

    if (!user || !session) { window.location.href = "/login?reason=auth"; return; }

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        merchant_id: user.id,
        amount: parsedAmount,
        customer: customer.trim() || null,
        description: description.trim() || null,
      })
      .select("id")
      .single();

    if (invoiceError || !invoice) {
      setError("Failed to create invoice. Please try again.");
      setLoading(false);
      setLoadingMessage("");
      return;
    }

    // Provision payment account behind the scenes (invisible to user)
    setLoadingMessage("Setting up your payment account...");
    await fetch("/api/invoices/" + invoice.id + "/generate-wallet", {
      method: "POST",
      headers: { Authorization: "Bearer " + session.access_token },
    });

    // Mark onboarding complete
    setLoadingMessage("Almost done...");
    await supabase
      .from("profiles")
      .update({ onboarding_step: 3, onboarding_completed: true })
      .eq("user_id", user.id);

    localStorage.removeItem("portpagos_company");

    window.location.href = "/dashboard?onboarding=complete";
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
          <p className="text-slate-500 text-sm mt-1">One last step — create your first invoice</p>
        </div>

        <StepBar current={3} />

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <h2 className="text-lg font-semibold mb-1">Create your first invoice</h2>
          <p className="text-slate-500 text-sm mb-6">
            Start receiving payments in minutes. You can create more from your dashboard.
          </p>

          <form onSubmit={handleCreateInvoice} className="space-y-5">

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Customer name <span className="text-slate-600">(optional)</span>
              </label>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="e.g. Maersk Line, Port of Rotterdam"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-16 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">USDC</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Description <span className="text-slate-600">(optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Port handling fees — March 2026"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              />
            </div>

            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">{error}</div>
            )}

            {loading && loadingMessage && (
              <div className="px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-sm text-center">
                {loadingMessage}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium transition-colors">
              {loading ? "Setting up..." : "Create invoice & go to dashboard →"}
            </button>
          </form>

          <button
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await supabase.from("profiles").update({ onboarding_completed: true }).eq("user_id", user.id);
              }
              window.location.href = "/dashboard";
            }}
            className="w-full text-center text-xs text-slate-600 hover:text-slate-400 mt-4 transition-colors"
          >
            Skip for now — I'll create an invoice later
          </button>
        </div>

      </div>
    </main>
  );
}
