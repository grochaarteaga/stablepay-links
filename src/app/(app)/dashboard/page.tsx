"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { WithdrawModal } from "@/components/WithdrawModal";
import { TopUpModal } from "@/components/TopUpModal";

type Invoice = {
  id: string;
  amount: number;
  currency: string;
  customer: string | null;
  description: string | null;
  status: string;
  created_at: string;
};

type LedgerEntry = {
  id: string;
  type: "credit" | "debit";
  amount: number;
  tx_hash: string | null;
  created_at: string;
  invoice_id: string | null;
  description: string | null;
};

type Topup = {
  id: string;
  reference: string;
  status: string;
  eur_amount_expected: number | null;
  usdc_amount: number | null;
  tx_hash: string | null;
  created_at: string;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-green-900/60 text-green-400",
    pending: "bg-yellow-900/60 text-yellow-400",
    cancelled: "bg-red-900/60 text-red-400",
    expired: "bg-red-900/60 text-red-400",
    failed: "bg-red-900/60 text-red-400",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${styles[status] ?? "bg-slate-700 text-slate-400"}`}>
      {status}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-slate-500 hover:text-slate-300 transition-colors text-xs px-1"
      title="Copy"
    >
      {copied ? "✓" : "⧉"}
    </button>
  );
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showSetupBanner, setShowSetupBanner] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [topups, setTopups] = useState<Topup[]>([]);
  const [siteOrigin, setSiteOrigin] = useState("");

  async function loadDashboard() {
    const { data: { user, session } } = await supabase.auth.getUser().then(async (r) => ({
      data: {
        user: r.data.user,
        session: (await supabase.auth.getSession()).data.session,
      },
    }));

    if (!user || !session) {
      window.location.href = "/login?reason=auth";
      return;
    }

    // Check onboarding state — redirect if incomplete
    const { data: profile } = await supabase
      .from("profiles").select("onboarding_step, onboarding_completed, country, business_type, company_name")
      .eq("user_id", user.id).maybeSingle();

    if (profile?.company_name) setCompanyName(profile.company_name);

    if (profile && !profile.onboarding_completed) {
      window.location.href = `/onboarding/step-${profile.onboarding_step}`;
      return;
    }

    // Show setup banner if profile is missing optional details
    if (!profile || !profile.country || !profile.business_type) {
      setShowSetupBanner(true);
    }

    // Show welcome message for newly onboarded users
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("onboarding") === "complete") {
        setIsNewUser(true);
      }
    }

    setUserEmail(user.email ?? null);

    // Ensure merchant wallet exists (creates one if not)
    await fetch("/api/merchant/wallet", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    const [
      { data: invoiceData, error: invoiceError },
      { data: ledgerData, error: ledgerError },
      { data: profileData },
      { data: topupData },
      { data: balanceData },
    ] = await Promise.all([
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("ledger_entries").select("*").eq("merchant_id", user.id).order("created_at", { ascending: false }),
      supabase.from("merchant_profiles").select("wallet_address").eq("user_id", user.id).maybeSingle(),
      supabase.from("topups").select("id, reference, status, eur_amount_expected, usdc_amount, tx_hash, created_at").eq("merchant_id", user.id).order("created_at", { ascending: false }),
      supabase.from("balances").select("amount").eq("merchant_id", user.id).maybeSingle(),
    ]);

    if (profileData?.wallet_address) setWalletAddress(profileData.wallet_address);
    setTopups((topupData as Topup[]) ?? []);

    // Balance comes from the materialised balances table (O(1), trigger-maintained).
    // ledger_entries are still fetched for the history display and analytics.
    setBalance(Number(balanceData?.amount ?? 0));

    if (invoiceError) console.error("Error loading invoices:", invoiceError.message);
    else setInvoices(invoiceData as Invoice[]);

    if (ledgerError) {
      console.error("Error loading ledger:", ledgerError.message);
    } else {
      setLedger(ledgerData as LedgerEntry[]);
    }

    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => { setSiteOrigin(window.location.origin); }, []);

  const thirtyDayReceived = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return ledger
      .filter(e =>
        e.type === "credit" &&
        new Date(e.created_at) >= cutoff &&
        !e.description?.startsWith("Reversal:")
      )
      .reduce((sum, e) => sum + e.amount, 0);
  }, [ledger]);

  const thirtyDayInvoiceCount = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return invoices.filter(i => i.status === "paid" && new Date(i.created_at) >= cutoff).length;
  }, [invoices]);

  const dailyChange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return ledger
      .filter(e =>
        e.type === "credit" &&
        new Date(e.created_at) >= today &&
        !e.description?.startsWith("Reversal:")
      )
      .reduce((sum, e) => sum + e.amount, 0);
  }, [ledger]);

  const filteredInvoices = useMemo(() =>
    invoices.filter(inv => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || inv.id.toLowerCase().includes(q) || (inv.customer?.toLowerCase().includes(q) ?? false);
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    }),
    [invoices, searchQuery, statusFilter]
  );

  const invoiceMap = useMemo(() =>
    Object.fromEntries(invoices.map(i => [i.id, i])),
    [invoices]
  );

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 px-6 md:px-10 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight">PortPagos</span>
            <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
              Merchant Account
            </span>
          </div>
          {companyName
            ? <p className="text-slate-400 text-xs mt-0.5">Welcome back, <span className="text-slate-300 font-medium">{companyName}</span></p>
            : userEmail && <p className="text-slate-500 text-xs mt-0.5">{userEmail}</p>
          }
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm hover:bg-slate-700 transition-colors"
        >
          Logout
        </button>
      </header>

      <div className="px-6 md:px-10 py-6 space-y-6 max-w-7xl mx-auto w-full flex-1">

        {/* ── Welcome banner (new users) ──────────────────────────── */}
        {isNewUser && (
          <div className="bg-green-900/20 border border-green-700/30 rounded-xl px-5 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-green-400 font-medium text-sm">Your account is ready</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Your first invoice is set up. Share the payment link with your customer to get paid.
              </p>
            </div>
            <button onClick={() => setIsNewUser(false)} className="text-slate-500 hover:text-slate-300 text-xs transition-colors whitespace-nowrap mt-0.5">✕</button>
          </div>
        )}

        {/* ── Setup banner (incomplete profile) ───────────────────── */}
        {showSetupBanner && !isNewUser && (
          <div className="bg-slate-900 border border-amber-700/30 rounded-xl px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">You're almost ready to receive payments</p>
                <p className="text-xs text-slate-400 mt-1">
                  Add your business details to start getting paid without limits.
                </p>
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">Account setup</span>
                    <span className="text-xs text-amber-400 font-medium">60% complete</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-3/5 bg-amber-500 rounded-full" />
                  </div>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1"><span className="text-green-400">✓</span> Account created</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><span className="text-green-400">✓</span> First invoice</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><span className="text-slate-600">○</span> Business verified</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <Link
                  href="/onboarding/step-2"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Complete setup
                </Link>
                <button onClick={() => setShowSetupBanner(false)} className="text-slate-600 hover:text-slate-400 text-xs transition-colors">✕</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Actions ───────────────────────────────────────── */}
        <section className="flex flex-wrap gap-3">
          <Link
            href="/invoices/new"
            className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium transition-colors"
          >
            + New Invoice
          </Link>
          <button
            disabled
            title="Coming soon: send payments directly to suppliers"
            className="group relative px-5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium opacity-50 cursor-not-allowed flex items-center gap-2"
          >
            Send Payment
            <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">Soon</span>
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={balance <= 0}
            title={balance <= 0 ? "No balance to withdraw" : "Withdraw funds to your wallet"}
            className="px-5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Withdraw
          </button>
          <button
            disabled
            title="EUR top-up coming soon"
            className="px-5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium opacity-50 cursor-not-allowed flex items-center gap-2"
          >
            Top up
            <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">Soon</span>
          </button>
        </section>

        {/* ── Balance + Analytics ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Balance card */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Available balance</p>
              {lastUpdated && (
                <p className="text-xs text-slate-600">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
            <p className="text-5xl font-bold text-white mt-3 tracking-tight">
              ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xl text-slate-500 ml-2 font-normal">USD</span>
            </p>
            <div className="flex items-center gap-4 mt-1.5">
              <p className="text-sm text-slate-500">
                {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
              </p>
              {dailyChange > 0 && (
                <p className="text-sm text-green-400 font-medium">+${dailyChange.toFixed(2)} today</p>
              )}
            </div>

          </div>

          {/* Analytics */}
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Money received this month</p>
              <p className="text-2xl font-bold text-white">
                ${thirtyDayReceived.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-600 mt-1">USDC</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Paid invoices this month</p>
              <p className="text-2xl font-bold text-white">{thirtyDayInvoiceCount}</p>
              <p className="text-xs text-slate-600 mt-1">invoices settled</p>
            </div>
          </div>
        </div>

        {/* ── How to get paid (shown only when no invoices) ─────────── */}
        {invoices.length === 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">Start getting paid in minutes</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step: "1", title: "Create an invoice", desc: "Add your customer name and amount." },
                { step: "2", title: "Send the payment link", desc: "Share via email, WhatsApp, or copy the link." },
                { step: "3", title: "Get paid instantly", desc: "Your balance updates the moment payment is received." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-600/20 border border-green-600/30 flex items-center justify-center text-green-400 text-xs font-bold flex-shrink-0 mt-0.5">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/invoices/new"
              className="inline-block mt-5 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium transition-colors"
            >
              + Create your first invoice
            </Link>
          </section>
        )}

        {/* ── Invoices ─────────────────────────────────────────────── */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Invoices</h2>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Search ID or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 w-52 focus:outline-none focus:border-slate-500 transition-colors"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:border-slate-500 transition-colors"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="text-center py-14">
              {searchQuery || statusFilter !== "all" ? (
                <>
                  <p className="text-slate-400 text-sm mb-1">No invoices match your filters.</p>
                  <p className="text-slate-600 text-xs">Try adjusting your search or filters.</p>
                </>
              ) : (
                <>
                  <p className="text-slate-300 text-base font-medium mb-2">No invoices yet</p>
                  <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                    Create your first invoice and start receiving payments in minutes.
                  </p>
                  <Link
                    href="/invoices/new"
                    className="inline-block px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium transition-colors"
                  >
                    + Create Invoice
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="text-left py-2 pb-3 font-medium">Invoice ID</th>
                    <th className="text-left py-2 pb-3 font-medium">Customer</th>
                    <th className="text-left py-2 pb-3 font-medium">Amount</th>
                    <th className="text-left py-2 pb-3 font-medium">Status</th>
                    <th className="text-left py-2 pb-3 font-medium">Date</th>
                    <th className="text-left py-2 pb-3 font-medium">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-800/60 last:border-none hover:bg-slate-800/30 transition-colors">
                      <td className="py-3">
                        <span className="font-mono text-xs text-slate-400">{inv.id.slice(0, 8)}...</span>
                      </td>
                      <td className="py-3">{inv.customer || <span className="text-slate-600">—</span>}</td>
                      <td className="py-3 font-medium">${inv.amount.toFixed(2)}</td>
                      <td className="py-3"><StatusBadge status={inv.status} /></td>
                      <td className="py-3 text-slate-500 text-xs">
                        {new Date(inv.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <CopyButton text={`${siteOrigin}/pay/${inv.id}`} />
                          <Link href={`/pay/${inv.id}`} target="_blank"
                            className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                            Open ↗
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Payment History ──────────────────────────────────────── */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-5">Payment History</h2>

          {ledger.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm mb-1">No payments received yet.</p>
              <p className="text-slate-600 text-xs">Payments will appear here once an invoice is settled.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="text-left py-2 pb-3 font-medium">Date</th>
                    <th className="text-left py-2 pb-3 font-medium">Type</th>
                    <th className="text-left py-2 pb-3 font-medium">From</th>
                    <th className="text-left py-2 pb-3 font-medium">Amount</th>
                    <th className="text-left py-2 pb-3 font-medium">Status</th>
                    <th className="text-left py-2 pb-3 font-medium">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((entry) => {
                    const related = entry.invoice_id ? invoiceMap[entry.invoice_id] : null;
                    return (
                      <tr key={entry.id} className="border-b border-slate-800/60 last:border-none hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 text-slate-500 text-xs">
                          {new Date(entry.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3">
                          {entry.type === "credit" && !entry.description?.startsWith("Reversal:") && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-900/50 text-green-400">↓ Payment</span>
                          )}
                          {entry.type === "credit" && entry.description?.startsWith("Reversal:") && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-900/50 text-amber-400">↩ Reversal</span>
                          )}
                          {entry.type === "debit" && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-900/50 text-blue-400">↑ Withdrawal</span>
                          )}
                        </td>
                        <td className="py-3 text-slate-300">
                          {entry.type === "credit" && !entry.description?.startsWith("Reversal:")
                            ? (related?.customer || <span className="text-slate-600">—</span>)
                            : <span className="text-slate-500 text-xs truncate max-w-[140px] block" title={entry.description ?? ""}>
                                {entry.description ?? "—"}
                              </span>
                          }
                        </td>
                        <td className="py-3 font-medium">
                          <span className={entry.type === "credit" ? "text-green-400" : "text-red-400"}>
                            {entry.type === "credit" ? "+" : "-"}${entry.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3">
                          {entry.type === "debit" && !entry.description?.startsWith("Reversal:") && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-400">Sent</span>
                          )}
                          {entry.description?.startsWith("Reversal:") && (
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-900/50 text-amber-400">Reversed</span>
                          )}
                          {entry.type === "credit" && !entry.description?.startsWith("Reversal:") && (
                            <span className="text-xs px-2 py-0.5 rounded bg-green-900/50 text-green-400">Confirmed</span>
                          )}
                        </td>
                        <td className="py-3">
                          {entry.tx_hash ? (
                            <div className="flex items-center gap-0.5">
                              <span className="font-mono text-xs text-slate-500">{entry.tx_hash.slice(0, 10)}...</span>
                              <CopyButton text={entry.tx_hash} />
                              <a href={`https://basescan.org/tx/${entry.tx_hash}`} target="_blank"
                                rel="noopener noreferrer" title="View transaction"
                                className="text-blue-400 hover:text-blue-300 text-xs ml-0.5 transition-colors">↗</a>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Top-up History ───────────────────────────────────────── */}
        {topups.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-5">Top-up History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="text-left py-2 pb-3 font-medium">Date</th>
                    <th className="text-left py-2 pb-3 font-medium">Reference</th>
                    <th className="text-left py-2 pb-3 font-medium">EUR sent</th>
                    <th className="text-left py-2 pb-3 font-medium">USDC received</th>
                    <th className="text-left py-2 pb-3 font-medium">Status</th>
                    <th className="text-left py-2 pb-3 font-medium">Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {topups.map((t) => {
                    const topupStatusStyles: Record<string, string> = {
                      awaiting_deposit: "bg-yellow-900/50 text-yellow-400",
                      deposit_received: "bg-blue-900/50 text-blue-400",
                      converting: "bg-blue-900/50 text-blue-400",
                      converted: "bg-blue-900/50 text-blue-400",
                      completed: "bg-green-900/50 text-green-400",
                      failed: "bg-red-900/50 text-red-400",
                      expired: "bg-red-900/50 text-red-400",
                    };
                    return (
                      <tr key={t.id} className="border-b border-slate-800/60 last:border-none hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 text-slate-500 text-xs">
                          {new Date(t.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3">
                          <span className="font-mono text-xs text-slate-300">{t.reference}</span>
                        </td>
                        <td className="py-3 text-slate-300">
                          {t.eur_amount_expected != null ? `€${Number(t.eur_amount_expected).toFixed(2)}` : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="py-3">
                          {t.usdc_amount != null
                            ? <span className="text-green-400 font-medium">+{Number(t.usdc_amount).toFixed(2)} USDC</span>
                            : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${topupStatusStyles[t.status] ?? "bg-slate-700 text-slate-400"}`}>
                            {t.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3">
                          {t.tx_hash ? (
                            <div className="flex items-center gap-0.5">
                              <span className="font-mono text-xs text-slate-500">{t.tx_hash.slice(0, 10)}...</span>
                              <CopyButton text={t.tx_hash} />
                              <a href={`https://basescan.org/tx/${t.tx_hash}`} target="_blank"
                                rel="noopener noreferrer" title="View transaction"
                                className="text-blue-400 hover:text-blue-300 text-xs ml-0.5 transition-colors">↗</a>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Account & Settings ───────────────────────────────────── */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-5">Account & Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Email</p>
              <p className="text-sm text-slate-300">{userEmail}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Bank withdrawal</p>
              <p className="text-xs text-slate-600">Coming soon</p>
            </div>
          </div>
        </section>

      </div>

      {/* ── Footer trust signal ──────────────────────────────────── */}
      <footer className="border-t border-slate-800/50 px-6 md:px-10 py-4 mt-auto">
        <p className="text-xs text-slate-700 text-center">
          Secure payments designed for global business operations
        </p>
      </footer>

      {/* ── Withdraw Modal ───────────────────────────────────────── */}
      {showWithdrawModal && (
        <WithdrawModal
          balance={balance}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => {
            setShowWithdrawModal(false);
            loadDashboard();
          }}
        />
      )}

      {/* ── Top-up Modal ─────────────────────────────────────────── */}
      {showTopUpModal && (
        <TopUpModal
          walletAddress={walletAddress}
          onClose={() => setShowTopUpModal(false)}
          onSuccess={() => {
            setShowTopUpModal(false);
            loadDashboard();
          }}
        />
      )}

    </main>
  );
}
