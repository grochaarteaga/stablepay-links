"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import { USDC_ABI, USDC_CONTRACT_ADDRESS, amountToUsdcUnits } from "@/lib/usdc";

// ── Types ────────────────────────────────────────────────────

type Invoice = {
  id: string;
  amount: number;
  currency: string;
  customer: string | null;
  description: string | null;
  status: string;
  invoice_wallet_address: string | null;
  created_at: string;
  merchant_name: string | null;
};

type Step =
  | "loading"
  | "error"
  | "blocked"
  | "method-select"
  | "crypto"
  | "paid";

// Statuses that prevent any new payment from being initiated
const BLOCKED_STATUSES = ["paid", "cancelled", "expired", "failed"];

// ── Small shared components ──────────────────────────────────

function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 mb-5"
    >
      ← Change payment method
    </button>
  );
}

// ── Invoice summary — shown at top of every active step ─────

function InvoiceSummary({ invoice }: { invoice: Invoice }) {
  return (
    <div className="mb-5 pb-5 border-b border-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          {invoice.merchant_name && (
            <p className="text-xs text-slate-500 mb-1">
              Invoice from <span className="text-slate-400 font-medium">{invoice.merchant_name}</span>
            </p>
          )}
          <p className="text-3xl font-bold tracking-tight">
            ${invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-base text-slate-500 font-normal ml-2">{invoice.currency || "USDC"}</span>
          </p>
          {invoice.description && (
            <p className="text-sm text-slate-400 mt-1">{invoice.description}</p>
          )}
          {invoice.customer && (
            <p className="text-xs text-slate-500 mt-0.5">For: {invoice.customer}</p>
          )}
        </div>
        <span className="text-xs text-slate-600 font-mono mt-1 flex-shrink-0">
          #{invoice.id.slice(0, 8).toUpperCase()}
        </span>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────

export default function PayInvoicePage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params.invoiceId;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Crypto state
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Wagmi
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending: isSendingTx } = useWriteContract();

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const pollCount = useRef(0);

  // ── Fetch invoice ────────────────────────────────────────

  const loadInvoice = useCallback(async () => {
    if (!invoiceId) return null;
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || "Invoice not found");
        setStep("error");
        return null;
      }
      return data.invoice as Invoice;
    } catch {
      setFetchError("Unable to load invoice. Check your connection and try again.");
      setStep("error");
      return null;
    }
  }, [invoiceId]);

  useEffect(() => {
    async function init() {
      const inv = await loadInvoice();
      if (!inv) return;
      setInvoice(inv);
      if (BLOCKED_STATUSES.includes(inv.status)) {
        setStep("blocked");
      } else {
        setStep("method-select");
      }
    }
    init();
  }, [loadInvoice]);

  // ── Poll for crypto payment confirmation ─────────────────

  useEffect(() => {
    if (!txHash || !isPolling) return;
    pollCount.current = 0;

    pollRef.current = setInterval(async () => {
      pollCount.current += 1;

      // Time out after ~90 seconds
      if (pollCount.current > 30) {
        clearInterval(pollRef.current!);
        setIsPolling(false);
        return;
      }

      const inv = await loadInvoice();
      if (inv?.status === "paid") {
        clearInterval(pollRef.current!);
        setIsPolling(false);
        setInvoice(inv);
        setStep("paid");
      }
    }, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [txHash, isPolling, loadInvoice]);

  // ── Payment handlers ─────────────────────────────────────

  async function handleCryptoPayment() {
    setTxError(null);
    setTxHash(null);

    if (!invoice?.invoice_wallet_address) {
      setTxError("No payment address on this invoice. Contact the merchant.");
      return;
    }
    if (!USDC_CONTRACT_ADDRESS) {
      setTxError("Payment system misconfigured. Contact support.");
      return;
    }
    if (!isConnected) {
      setTxError("Please connect your wallet first.");
      return;
    }

    if (chainId !== base.id) {
      try {
        await switchChainAsync({ chainId: base.id });
      } catch {
        setTxError("Please switch to the Base network in your wallet and try again.");
        return;
      }
    }

    try {
      const amountUnits = amountToUsdcUnits(invoice.amount);
      const hash = await writeContractAsync({
        address: USDC_CONTRACT_ADDRESS,
        abi: USDC_ABI,
        functionName: "transfer",
        args: [invoice.invoice_wallet_address as `0x${string}`, amountUnits],
      });
      setTxHash(hash);
      setIsPolling(true);
    } catch (err: any) {
      const isRejected = err?.code === 4001 || err?.message?.includes("rejected") || err?.message?.includes("denied");
      setTxError(
        isRejected
          ? "Transaction cancelled."
          : err?.shortMessage || err?.message || "Transaction failed. Please try again."
      );
    }
  }

  // ── Render states ────────────────────────────────────────

  if (step === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-500 text-sm">Loading invoice...</p>
      </main>
    );
  }

  if (step === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-900/20 border border-red-800/30 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold">Invoice not available</h1>
            <p className="text-slate-400 text-sm mt-1">
              {fetchError || "This invoice could not be found. Please check the link or contact the merchant."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (step === "blocked" && invoice) {
    const config: Record<string, { title: string; message: string; badge: string; badgeColor: string }> = {
      paid: {
        title: "Invoice already paid",
        message: `This invoice for $${invoice.amount.toFixed(2)} ${invoice.currency || "USDC"} has been settled. No further payment is needed.`,
        badge: "Paid",
        badgeColor: "bg-green-900/50 text-green-400",
      },
      cancelled: {
        title: "Invoice cancelled",
        message: "This invoice has been cancelled by the merchant. Please contact them if you have questions.",
        badge: "Cancelled",
        badgeColor: "bg-slate-700 text-slate-400",
      },
      expired: {
        title: "Invoice expired",
        message: "This invoice has expired. Please ask the merchant to issue a new one.",
        badge: "Expired",
        badgeColor: "bg-slate-700 text-slate-400",
      },
      failed: {
        title: "Invoice unavailable",
        message: "This invoice is no longer active. Please contact the merchant.",
        badge: "Unavailable",
        badgeColor: "bg-red-900/50 text-red-400",
      },
    };

    const c = config[invoice.status] ?? config.failed;

    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {invoice.merchant_name ?? "Invoice"}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.badgeColor}`}>{c.badge}</span>
          </div>
          <div className="py-6 text-center space-y-3">
            <p className="text-3xl font-bold">
              ${invoice.amount.toFixed(2)}
              <span className="text-base text-slate-500 font-normal ml-2">{invoice.currency || "USDC"}</span>
            </p>
            <div>
              <p className="text-base font-semibold">{c.title}</p>
              <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">{c.message}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-600 font-mono">Ref #{invoice.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <p className="absolute bottom-6 text-xs text-slate-700 flex items-center gap-1.5">
          <ShieldIcon /> Secure payment · Powered by PortPagos
        </p>
      </main>
    );
  }

  if (!invoice) return null;

  // ── Active payment flow ──────────────────────────────────

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-black/40">

          <InvoiceSummary invoice={invoice} />

          {/* ── Step: Method selection ──────────────────── */}
          {step === "method-select" && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">
                How would you like to pay?
              </p>

              {/* Crypto */}
              <button
                onClick={() => setStep("crypto")}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-slate-700 hover:border-slate-500 hover:bg-slate-800/40 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-900/30 border border-blue-800/40 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                    <circle cx="12" cy="12" r="10" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2.5-5 2.5-5 5a2.5 2.5 0 0 0 5 0" /><line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Pay with crypto wallet</p>
                  <p className="text-xs text-slate-500 mt-0.5">MetaMask · WalletConnect · Instant</p>
                </div>
                <ChevronRight />
              </button>

              {/* Bank transfer — coming soon */}
              <div className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-slate-800 opacity-40 cursor-not-allowed">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-500">Pay by bank transfer</p>
                  <p className="text-xs text-slate-600 mt-0.5">Wire · SWIFT · Coming soon</p>
                </div>
              </div>

              {/* Card — coming soon */}
              <div className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-slate-800 opacity-40 cursor-not-allowed">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                    <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-500">Pay with card</p>
                  <p className="text-xs text-slate-600 mt-0.5">Coming soon</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step: Crypto wallet ─────────────────────── */}
          {step === "crypto" && (
            <div className="space-y-5">
              <BackButton onClick={() => { setStep("method-select"); setTxError(null); setTxHash(null); }} />

              {/* Connect wallet */}
              <div>
                <p className="text-xs font-medium text-slate-400 mb-3">Connect your wallet</p>
                <w3m-button />
                {isConnected && connectedAddress && (
                  <p className="text-xs text-green-400 mt-2.5 flex items-center gap-1.5">
                    <span>✓</span> {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                  </p>
                )}
              </div>

              {/* Payment summary */}
              {isConnected && (
                <div className="bg-slate-800/50 rounded-xl divide-y divide-slate-700/50">
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-xs text-slate-500">Amount</span>
                    <span className="text-sm font-semibold">${invoice.amount.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-xs text-slate-500">Network</span>
                    <span className="text-sm text-slate-300">Base</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-xs text-slate-500">To</span>
                    <span className="text-xs text-slate-300 font-mono">
                      {invoice.invoice_wallet_address
                        ? `${invoice.invoice_wallet_address.slice(0, 6)}...${invoice.invoice_wallet_address.slice(-4)}`
                        : "—"}
                    </span>
                  </div>
                </div>
              )}

              {/* Polling state */}
              {txHash && isPolling && (
                <div className="px-4 py-3 rounded-lg bg-blue-900/20 border border-blue-700/30 text-blue-300">
                  <p className="text-sm font-medium">Transaction submitted</p>
                  <p className="text-xs mt-1 text-blue-400">
                    Waiting for confirmation on Base...{" "}
                    <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">
                      View ↗
                    </a>
                  </p>
                </div>
              )}

              {txError && (
                <div className="px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
                  {txError}
                </div>
              )}

              <button
                onClick={handleCryptoPayment}
                disabled={!isConnected || isSendingTx || isPolling || !invoice.invoice_wallet_address}
                className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {isSendingTx
                  ? "Confirm in wallet..."
                  : isPolling
                  ? "Confirming payment..."
                  : `Pay $${invoice.amount.toFixed(2)} USDC`}
              </button>

              {!invoice.invoice_wallet_address && (
                <p className="text-xs text-amber-400 text-center">
                  Payment address not set. Contact the merchant.
                </p>
              )}
            </div>
          )}


          {/* ── Step: Crypto confirmed ──────────────────── */}
          {step === "paid" && (
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-green-600/10 border border-green-600/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold">Payment received</p>
                <p className="text-sm text-slate-400 mt-1">
                  ${invoice.amount.toFixed(2)} {invoice.currency || "USDC"} confirmed on Base.
                </p>
              </div>
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors inline-block"
                >
                  View transaction on BaseScan ↗
                </a>
              )}
            </div>
          )}

        </div>

        {/* Trust footer */}
        <p className="text-center text-xs text-slate-700 mt-5 flex items-center justify-center gap-1.5">
          <ShieldIcon /> Secure payment · Powered by PortPagos
        </p>
      </div>
    </main>
  );
}
