"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login?reason=auth"; return; }

      setEmail(user.email ?? null);

      const [{ data: profile }, { data: merchant }] = await Promise.all([
        supabase.from("profiles").select("company_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("merchant_profiles").select("wallet_address").eq("user_id", user.id).maybeSingle(),
      ]);

      setCompanyName(profile?.company_name ?? null);
      setWalletAddress(merchant?.wallet_address ?? null);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="px-6 md:px-10 py-6 space-y-6 max-w-3xl w-full flex-1">

        <div>
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your account and merchant profile.</p>
        </div>

        {/* Account */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Account</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-slate-500 mb-1">Email</p>
              <p className="text-sm text-slate-200">{email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Company name</p>
              <p className="text-sm text-slate-200">{companyName ?? <span className="text-slate-600">Not set</span>}</p>
            </div>
          </div>

          <div className="pt-1">
            <Link
              href="/forgot-password"
              className="text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              Change password →
            </Link>
          </div>
        </section>

        {/* Wallet */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Merchant Wallet</h2>

          <div>
            <p className="text-xs text-slate-500 mb-1">Receiving address (Base · USDC)</p>
            {walletAddress ? (
              <p className="font-mono text-xs text-slate-300 break-all">{walletAddress}</p>
            ) : (
              <p className="text-xs text-slate-600">Not yet created — visit your dashboard to initialise.</p>
            )}
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Bank withdrawal</p>
            <p className="text-xs text-slate-600">Coming soon</p>
          </div>
        </section>

      </div>
    </main>
  );
}
