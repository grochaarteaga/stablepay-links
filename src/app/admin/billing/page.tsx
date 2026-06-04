"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const FEE_RATE = 0.006;

type InvoiceRow = {
  id: string;
  amount: number;
  currency: string;
  customer: string | null;
  description: string | null;
  paid_at: string;
};

type MerchantBilling = {
  merchantId: string;
  companyName: string;
  email: string;
  exempt: boolean;
  invoices: InvoiceRow[];
  volume: number;
  fee: number;
};

type BillingData = {
  merchants: MerchantBilling[];
  totals: { volume: number; fee: number; invoiceCount: number };
};

function getMonthRange(offset = 0): { start: string; end: string; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const d = new Date(year, month, 1);
  const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const end = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}T23:59:59`;
  const label = d.toLocaleString("en-US", { month: "long", year: "numeric" });
  return { start, end, label };
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function billingText(merchant: MerchantBilling, period: string): string {
  return [
    `PortPagos — Billing Summary`,
    `Period: ${period}`,
    `Merchant: ${merchant.companyName} (${merchant.email})`,
    ``,
    `Invoices settled: ${merchant.invoices.length}`,
    `Total volume: $${fmt(merchant.volume)} USDC`,
    `PortPagos fee (0.60%): $${fmt(merchant.fee)} USDC`,
    merchant.exempt ? `Status: FEE EXEMPT this period` : ``,
    ``,
    `Please arrange payment of $${fmt(merchant.fee)} USDC to PortPagos.`,
    `Questions: guillermo@portpagos.com`,
  ].filter((l) => l !== undefined).join("\n");
}

export default function BillingPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const { start, end, label } = getMonthRange(monthOffset);

  // Auth check — redirect if not admin
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setAuthorized(true);
      setAuthChecked(true);
    });
  }, [router]);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(
      `/api/admin/billing?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
      { headers: { Authorization: `Bearer ${session.access_token}` } }
    );
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Failed to load billing data.");
      if (res.status === 401) router.replace("/dashboard");
      return;
    }
    setData(json);
  }, [start, end, router]);

  useEffect(() => {
    if (authorized) fetchBilling();
  }, [authorized, fetchBilling]);

  async function copyBilling(merchant: MerchantBilling) {
    await navigator.clipboard.writeText(billingText(merchant, label));
    setCopied(merchant.merchantId);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-500 text-sm">Checking access...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Admin</p>
            <h1 className="text-xl font-semibold mt-0.5">Billing</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonthOffset((o) => o - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm hover:bg-slate-700 transition-colors"
            >
              ←
            </button>
            <span className="text-sm font-medium w-36 text-center">{label}</span>
            <button
              onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))}
              disabled={monthOffset === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>
        </div>

        {/* Totals banner */}
        {data && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total volume", value: `$${fmt(data.totals.volume)} USDC` },
              { label: "Total fees owed", value: `$${fmt(data.totals.fee)} USDC` },
              { label: "Paid invoices", value: String(data.totals.invoiceCount) },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-xl font-semibold mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Loading / error */}
        {loading && <p className="text-slate-500 text-sm">Loading...</p>}
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* No data */}
        {data && data.merchants.length === 0 && !loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400 text-sm">No paid invoices in {label}.</p>
          </div>
        )}

        {/* Merchant rows */}
        {data && data.merchants.map((merchant) => (
          <div key={merchant.merchantId} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

            {/* Merchant summary row */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{merchant.companyName}</p>
                  {merchant.exempt && (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-900/40 text-amber-400 flex-shrink-0">
                      Exempt
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{merchant.email}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold">${fmt(merchant.volume)} USDC</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {merchant.invoices.length} invoice{merchant.invoices.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right flex-shrink-0 w-32">
                <p className={`text-sm font-semibold ${merchant.exempt ? "text-slate-500 line-through" : "text-green-400"}`}>
                  ${fmt(merchant.fee)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">fee owed</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => copyBilling(merchant)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs hover:bg-slate-700 transition-colors"
                >
                  {copied === merchant.merchantId ? "Copied ✓" : "Copy summary"}
                </button>
                <button
                  onClick={() => setExpanded(expanded === merchant.merchantId ? null : merchant.merchantId)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs hover:bg-slate-700 transition-colors"
                >
                  {expanded === merchant.merchantId ? "Hide" : "Details"}
                </button>
              </div>
            </div>

            {/* Invoice drill-down */}
            {expanded === merchant.merchantId && (
              <div className="border-t border-slate-800 divide-y divide-slate-800/60">
                {merchant.invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                    <span className="text-slate-600 font-mono text-xs w-20 flex-shrink-0">
                      #{inv.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-slate-400 flex-1 truncate">
                      {inv.customer || inv.description || "—"}
                    </span>
                    <span className="text-slate-300 flex-shrink-0">
                      ${fmt(Number(inv.amount))} USDC
                    </span>
                    <span className="text-green-400/70 text-xs flex-shrink-0 w-20 text-right">
                      ${fmt(Number(inv.amount) * FEE_RATE)}
                    </span>
                    <span className="text-slate-600 text-xs flex-shrink-0 w-24 text-right">
                      {new Date(inv.paid_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

      </div>
    </main>
  );
}
