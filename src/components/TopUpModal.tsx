"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

type Step =
  | "amount"
  | "sepa-instructions"
  | "awaiting-deposit"
  | "confirm-convert"
  | "processing"
  | "success"
  | "failed";

type SepaInstructions = {
  beneficiary_name: string;
  iban: string;
  bic: string;
  reference: string;
  amount_eur: number;
};

type Quote = {
  fx_rate: number | null;
  usdc_amount: number | null;
  fee_eur: number | null;
  valid_for_seconds: number | null;
};

type Topup = {
  id: string;
  status: string;
  tx_hash: string | null;
  usdc_amount: number | null;
  error_message: string | null;
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs hover:border-slate-500 transition-colors"
    >
      {copied ? <span className="text-green-400">✓ Copied</span> : <span className="text-slate-400">Copy {label}</span>}
    </button>
  );
}

export function TopUpModal({
  walletAddress,
  onClose,
  onSuccess,
}: {
  walletAddress: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<Step>("amount");
  const [amountEur, setAmountEur] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [topupId, setTopupId] = useState<string | null>(null);
  const [sepa, setSepa] = useState<SepaInstructions | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [topup, setTopup] = useState<Topup | null>(null);
  const [failureMessage, setFailureMessage] = useState("");

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const parsedAmount = parseFloat(amountEur) || 0;
  // Rough placeholder rate (1 EUR ≈ 1.07 USDC)
  const estimatedUsdc = parsedAmount > 0 ? (parsedAmount * 1.07).toFixed(2) : null;

  function stopPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  useEffect(() => {
    return () => stopPolling();
  }, []);

  function startPolling(id: string, intervalMs: number, onUpdate: (t: Topup) => void) {
    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`/api/topups/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = await res.json() as Topup;
      onUpdate(data);
    }, intervalMs);
  }

  async function handleCreateTopup() {
    setError("");
    if (parsedAmount < 10) { setError("Minimum top-up is €10."); return; }
    if (parsedAmount > 50000) { setError("Maximum top-up is €50,000."); return; }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = "/login?reason=auth"; return; }

    const res = await fetch("/api/topups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ amount_eur: parsedAmount }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to create top-up. Please try again.");
      return;
    }

    setTopupId(data.topup_id);
    setSepa(data.sepa_instructions);
    setStep("sepa-instructions");
  }

  function handleSentTransfer() {
    if (!topupId) return;
    setStep("awaiting-deposit");

    // Poll every 10 seconds waiting for deposit_received
    startPolling(topupId, 10_000, (t) => {
      if (t.status === "deposit_received") {
        stopPolling();
        setTopup(t);
        loadQuote(topupId!);
      }
    });
  }

  async function loadQuote(id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`/api/topups/${id}/quote`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const q = await res.json();
      setQuote(q);
    }
    setStep("confirm-convert");
  }

  async function handleConfirmConvert() {
    if (!topupId) return;
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = "/login?reason=auth"; return; }

    const res = await fetch(`/api/topups/${topupId}/convert`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to start conversion. Please try again.");
      return;
    }

    setStep("processing");

    // Poll every 5 seconds waiting for completed or failed
    startPolling(topupId, 5_000, (t) => {
      if (t.status === "completed") {
        stopPolling();
        setTopup(t);
        setStep("success");
        onSuccess();
      } else if (t.status === "failed") {
        stopPolling();
        setFailureMessage(t.error_message || "Conversion failed.");
        setTopup(t);
        setStep("failed");
      }
    });
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    // Allow closing unless processing (conversion in progress)
    if (step === "processing") return;
    if (e.target === e.currentTarget) onClose();
  }

  const stepTitle: Record<Step, string> = {
    "amount": "Top up with EUR",
    "sepa-instructions": "Send EUR bank transfer",
    "awaiting-deposit": "Waiting for deposit",
    "confirm-convert": "Convert to USDC",
    "processing": "Converting...",
    "success": "Top-up complete",
    "failed": "Top-up failed",
  };

  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "";

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800">
          <h2 className="text-base font-semibold">{stepTitle[step]}</h2>
          {step !== "processing" && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
            >
              ✕
            </button>
          )}
        </div>

        <div className="px-6 py-5">

          {/* ── Step: amount ──────────────────────────── */}
          {step === "amount" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Amount (EUR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">€</span>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="50000"
                    value={amountEur}
                    onChange={(e) => setAmountEur(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-16 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">EUR</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">Min €10 · Max €50,000</p>
              </div>

              {estimatedUsdc && (
                <div className="bg-slate-800/60 rounded-xl px-4 py-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">You send</span>
                    <span className="text-slate-300">€{parsedAmount.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">You receive (est.)</span>
                    <span className="text-white font-medium">~{estimatedUsdc} USDC</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Destination</span>
                    <span className="text-slate-300 font-mono">{shortWallet}</span>
                  </div>
                  <p className="text-xs text-slate-600 pt-1">
                    Final rate shown after deposit arrives
                  </p>
                </div>
              )}

              {error && (
                <div className="px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleCreateTopup}
                disabled={loading || parsedAmount <= 0}
                className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {loading ? "Setting up..." : "Continue →"}
              </button>
            </div>
          )}

          {/* ── Step: sepa-instructions ───────────────── */}
          {step === "sepa-instructions" && sepa && (
            <div className="space-y-5">
              <p className="text-xs text-slate-400">
                Send exactly <span className="text-white font-medium">€{sepa.amount_eur.toFixed(2)}</span> via SEPA bank transfer using the details below. Use the reference exactly as shown.
              </p>

              <div className="bg-slate-800/60 rounded-xl divide-y divide-slate-700/50">
                {[
                  { label: "Beneficiary", value: sepa.beneficiary_name },
                  { label: "IBAN", value: sepa.iban, mono: true },
                  { label: "BIC / SWIFT", value: sepa.bic, mono: true },
                  { label: "Amount", value: `€${sepa.amount_eur.toFixed(2)} EUR` },
                  { label: "Reference", value: sepa.reference, mono: true, highlight: true },
                ].map(({ label, value, mono, highlight }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3 gap-3">
                    <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
                    <span className={`text-sm text-right ${mono ? "font-mono" : ""} ${highlight ? "text-green-300 font-medium" : "text-slate-300"}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap">
                <CopyButton text={sepa.iban} label="IBAN" />
                <CopyButton text={sepa.reference} label="Reference" />
              </div>

              <div className="px-3 py-2.5 rounded-lg bg-amber-900/20 border border-amber-700/30 text-amber-300/80 text-xs">
                Once you send the EUR from your bank, we'll notify you when it arrives. This usually takes 1–2 business days.
              </div>

              <button
                onClick={handleSentTransfer}
                className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium transition-colors"
              >
                I've sent the transfer
              </button>
            </div>
          )}

          {/* ── Step: awaiting-deposit ────────────────── */}
          {step === "awaiting-deposit" && (
            <div className="py-8 text-center space-y-4">
              <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-blue-600/10 border border-blue-600/20">
                <svg
                  className="animate-spin w-5 h-5 text-blue-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Waiting for your EUR deposit...</p>
                <p className="text-xs text-slate-500 mt-1">
                  Reference: <span className="font-mono text-slate-300">{sepa?.reference}</span>
                </p>
              </div>
              <p className="text-xs text-slate-600">
                This can take 1–2 business days. You can close this window and come back later.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm hover:bg-slate-700 transition-colors"
              >
                Close — I'll check back later
              </button>
            </div>
          )}

          {/* ── Step: confirm-convert ─────────────────── */}
          {step === "confirm-convert" && (
            <div className="space-y-5">
              <p className="text-xs text-slate-400">
                Your EUR deposit has arrived. Review the conversion details and confirm to receive USDC in your wallet.
              </p>

              <div className="bg-slate-800/60 rounded-xl divide-y divide-slate-700/50">
                {[
                  {
                    label: "EUR received",
                    value: topup?.status === "deposit_received"
                      ? `€${(topup as any)?.eur_amount_received?.toFixed(2) ?? sepa?.amount_eur.toFixed(2)}`
                      : `€${sepa?.amount_eur.toFixed(2)}`,
                  },
                  {
                    label: "Exchange rate",
                    value: quote?.fx_rate ? `1 EUR = ${quote.fx_rate.toFixed(4)} USDC` : "Loading...",
                  },
                  {
                    label: "Bridge fee",
                    value: quote?.fee_eur != null ? `€${Number(quote.fee_eur).toFixed(2)}` : "—",
                  },
                  {
                    label: "You receive",
                    value: quote?.usdc_amount != null
                      ? <span className="text-white font-semibold">{Number(quote.usdc_amount).toFixed(2)} USDC</span>
                      : "Loading...",
                  },
                  {
                    label: "Destination",
                    value: <span className="font-mono text-xs">{shortWallet}</span>,
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-sm text-slate-300">{value}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-600">
                If you don't convert now, your EUR stays in your Bridge account and you can convert later.
              </p>

              {error && (
                <div className="px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  Later
                </button>
                <button
                  onClick={handleConfirmConvert}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {loading ? "Starting..." : "Convert to USDC →"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step: processing ──────────────────────── */}
          {step === "processing" && (
            <div className="py-8 text-center space-y-4">
              <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-green-600/10 border border-green-600/20">
                <svg
                  className="animate-spin w-5 h-5 text-green-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Converting EUR to USDC...</p>
                <p className="text-xs text-slate-500 mt-1">Bridge is processing your conversion</p>
              </div>
              <p className="text-xs text-slate-600">
                Do not close this window. This usually takes a few minutes.
              </p>
            </div>
          )}

          {/* ── Step: success ─────────────────────────── */}
          {step === "success" && (
            <div className="py-4 text-center space-y-4">
              <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-green-600/10 border border-green-600/20">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-400"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-white">USDC received</p>
                {topup?.usdc_amount && (
                  <p className="text-sm text-slate-400 mt-1">
                    {Number(topup.usdc_amount).toFixed(2)} USDC → {shortWallet}
                  </p>
                )}
              </div>
              <div className="bg-slate-800/60 rounded-xl divide-y divide-slate-700/50 text-left">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-500">Network</span>
                  <span className="text-xs text-slate-300">Base</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-500">Status</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-900/50 text-green-400">Completed</span>
                </div>
                {topup?.tx_hash && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-slate-500">Transaction</span>
                    <a
                      href={`https://basescan.org/tx/${topup.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors"
                    >
                      {topup.tx_hash.slice(0, 10)}... ↗
                    </a>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* ── Step: failed ──────────────────────────── */}
          {step === "failed" && (
            <div className="py-4 text-center space-y-4">
              <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-red-600/10 border border-red-600/20">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-400"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-white">Top-up failed</p>
                <p className="text-sm text-slate-400 mt-1">{failureMessage}</p>
              </div>
              <p className="text-xs text-slate-500">
                If you deposited EUR, the funds will be returned to your bank account.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
