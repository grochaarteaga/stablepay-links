"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { isAddress, getAddress } from "viem";

type PayoutWallet = {
  id: string;
  wallet_name: string;
  address: string;
  network: string;
};

type Step =
  | "wallet-select"
  | "add-wallet"
  | "review"
  | "processing"
  | "success"
  | "failed";

const QUICK_PERCENTAGES = [25, 50, 75, 100];

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function WithdrawModal({
  balance,
  onClose,
  onSuccess,
}: {
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<Step>("wallet-select");
  const [wallets, setWallets] = useState<PayoutWallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Add-wallet fields
  const [walletName, setWalletName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  // Result state
  const [txHash, setTxHash] = useState<string | null>(null);
  const [failureMessage, setFailureMessage] = useState("");

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId) ?? null;
  const parsedAmount = parseFloat(amount) || 0;
  const remainingBalance = balance - parsedAmount;

  useEffect(() => {
    loadWallets();
  }, []);

  async function loadWallets() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("/api/payout-wallets", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setWallets(data as PayoutWallet[]);
      if (data.length > 0 && !selectedWalletId) {
        setSelectedWalletId(data[0].id);
      }
    }
  }

  async function handleAddWallet(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!walletName.trim()) { setError("Wallet name is required."); return; }
    if (!walletAddress.trim()) { setError("Wallet address is required."); return; }
    if (!isAddress(walletAddress)) {
      setError("Invalid wallet address. Please enter a valid Ethereum address.");
      return;
    }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = "/login?reason=auth"; return; }

    const res = await fetch("/api/payout-wallets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        wallet_name: walletName.trim(),
        address: getAddress(walletAddress.trim()),
        network: "base",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to add wallet.");
      setLoading(false);
      return;
    }

    await loadWallets();
    setSelectedWalletId(data.id);
    setWalletName("");
    setWalletAddress("");
    setStep("wallet-select");
    setLoading(false);
  }

  async function handleConfirmWithdrawal() {
    setError("");

    if (!selectedWallet) { setError("Please select a wallet."); return; }
    if (parsedAmount <= 0) { setError("Please enter an amount."); return; }
    if (parsedAmount > balance) { setError("Amount exceeds available balance."); return; }

    setStep("processing");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = "/login?reason=auth"; return; }

    const res = await fetch("/api/withdrawals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        wallet_id: selectedWallet.id,
        amount: parsedAmount,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.status === "failed") {
      setFailureMessage(data.error || "Withdrawal failed. Please try again.");
      setStep("failed");
      return;
    }

    setTxHash(data.tx_hash ?? null);
    setStep("success");
    onSuccess();
  }

  function proceedToReview() {
    setError("");
    if (!selectedWallet) { setError("Please select a wallet."); return; }
    if (parsedAmount <= 0) { setError("Please enter an amount."); return; }
    if (parsedAmount > balance) { setError("Amount exceeds available balance."); return; }
    setStep("review");
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  const stepTitle: Record<Step, string> = {
    "wallet-select": "Withdraw funds",
    "add-wallet": "Add payout wallet",
    review: "Review withdrawal",
    processing: "Processing...",
    success: "Withdrawal submitted",
    failed: "Withdrawal failed",
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold">{stepTitle[step]}</h2>
            {step === "wallet-select" && (
              <p className="text-xs text-slate-500 mt-0.5">
                Available:{" "}
                <span className="text-white font-medium">
                  ${balance.toFixed(2)} USDC
                </span>
              </p>
            )}
          </div>
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

          {/* ── Step: wallet-select ─────────────────────── */}
          {step === "wallet-select" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Payout wallet
                </label>
                {wallets.length === 0 ? (
                  <button
                    onClick={() => setStep("add-wallet")}
                    className="w-full px-4 py-3 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300 text-sm transition-colors text-center"
                  >
                    + Add your first payout wallet
                  </button>
                ) : (
                  <div className="space-y-2">
                    {wallets.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => setSelectedWalletId(w.id)}
                        className={`w-full px-4 py-3 rounded-lg border text-left transition-colors flex items-center justify-between ${
                          selectedWalletId === w.id
                            ? "border-green-500/50 bg-green-900/10"
                            : "border-slate-700 hover:border-slate-600"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium">{w.wallet_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 font-mono">
                            {shortenAddress(w.address)}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
                          {w.network}
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={() => setStep("add-wallet")}
                      className="w-full px-4 py-2 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500 text-xs transition-colors"
                    >
                      + Add another wallet
                    </button>
                  </div>
                )}
              </div>

              {wallets.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Amount (USDC)
                  </label>

                  {/* Quick % shortcuts */}
                  <div className="flex gap-2 mb-2">
                    {QUICK_PERCENTAGES.map((pct) => (
                      <button
                        key={pct}
                        onClick={() =>
                          setAmount(((balance * pct) / 100).toFixed(2))
                        }
                        className="flex-1 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs hover:border-slate-500 transition-colors"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="10"
                      max={balance}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-16 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                      USDC
                    </span>
                  </div>

                  {parsedAmount > 0 && (
                    <div
                      className={`mt-2 text-xs flex justify-between ${
                        remainingBalance < 0
                          ? "text-red-400"
                          : "text-slate-500"
                      }`}
                    >
                      <span>Remaining balance</span>
                      <span className="font-medium">
                        {remainingBalance >= 0
                          ? `$${remainingBalance.toFixed(2)}`
                          : "Insufficient funds"}
                      </span>
                    </div>
                  )}

                </div>
              )}

              {error && (
                <div className="px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {wallets.length > 0 && (
                <button
                  onClick={proceedToReview}
                  className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium transition-colors"
                >
                  Review withdrawal →
                </button>
              )}
            </div>
          )}

          {/* ── Step: add-wallet ────────────────────────── */}
          {step === "add-wallet" && (
            <form onSubmit={handleAddWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Wallet name
                </label>
                <input
                  type="text"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder="e.g. Company Wallet, Main Wallet"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Network
                </label>
                <div className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 flex items-center justify-between">
                  <span>Base (Ethereum L2)</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-900/40 text-blue-400">
                    Only supported network
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Wallet address
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-mono placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                  required
                />
                {walletAddress && isAddress(walletAddress) && (
                  <p className="mt-1.5 text-xs text-green-400 flex items-center gap-1">
                    <span>✓</span>{" "}
                    Valid — {shortenAddress(getAddress(walletAddress))}
                  </p>
                )}
                {walletAddress && !isAddress(walletAddress) && (
                  <p className="mt-1.5 text-xs text-red-400">
                    Invalid Ethereum address
                  </p>
                )}
              </div>

              <div className="px-3 py-2.5 rounded-lg bg-amber-900/20 border border-amber-700/30 text-amber-300/80 text-xs">
                Double-check this address. Blockchain transfers cannot be
                reversed.
              </div>

              {error && (
                <div className="px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep("wallet-select"); setError(""); }}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {loading ? "Saving..." : "Save wallet"}
                </button>
              </div>
            </form>
          )}

          {/* ── Step: review ────────────────────────────── */}
          {step === "review" && selectedWallet && (
            <div className="space-y-5">
              <div className="bg-slate-800/60 rounded-xl divide-y divide-slate-700/50">
                {[
                  { label: "From", value: "PortPagos balance" },
                  {
                    label: "To",
                    value: (
                      <span className="text-right">
                        <span className="text-slate-200">
                          {selectedWallet.wallet_name}
                        </span>
                        <span className="text-slate-500 font-mono text-xs ml-2">
                          {shortenAddress(selectedWallet.address)}
                        </span>
                      </span>
                    ),
                  },
                  { label: "Network", value: "Base" },
                  {
                    label: "Amount",
                    value: (
                      <span className="text-white font-semibold">
                        ${parsedAmount.toFixed(2)} USDC
                      </span>
                    ),
                  },
                  {
                    label: "Fee",
                    value: (
                      <span className="text-green-400 text-xs">
                        No fees for now
                      </span>
                    ),
                  },
                  {
                    label: "Remaining balance",
                    value: (
                      <span
                        className={
                          remainingBalance < 0 ? "text-red-400" : ""
                        }
                      >
                        ${remainingBalance.toFixed(2)} USDC
                      </span>
                    ),
                  },
                  { label: "Estimated arrival", value: "~1–2 minutes" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-sm text-slate-300">{value}</span>
                  </div>
                ))}
              </div>

              <div className="px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-500 text-xs">
                Review carefully — blockchain transfers cannot be reversed.
              </div>

              {error && (
                <div className="px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep("wallet-select"); setError(""); }}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmWithdrawal}
                  className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium transition-colors"
                >
                  Confirm withdrawal
                </button>
              </div>
            </div>
          )}

          {/* ── Step: processing ────────────────────────── */}
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
                <p className="text-sm font-medium text-white">
                  Processing withdrawal...
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Sending ${parsedAmount.toFixed(2)} USDC to{" "}
                  {selectedWallet ? shortenAddress(selectedWallet.address) : ""}
                </p>
              </div>
              <p className="text-xs text-slate-600">
                This usually takes 1–2 minutes. Do not close this window.
              </p>
            </div>
          )}

          {/* ── Step: success ────────────────────────────── */}
          {step === "success" && selectedWallet && (
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
                <p className="text-base font-semibold text-white">
                  Withdrawal completed
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  ${parsedAmount.toFixed(2)} USDC → {selectedWallet.wallet_name}
                </p>
              </div>
              <div className="bg-slate-800/60 rounded-xl divide-y divide-slate-700/50 text-left">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-500">Destination</span>
                  <span className="text-xs text-slate-300 font-mono">
                    {shortenAddress(selectedWallet.address)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-500">Network</span>
                  <span className="text-xs text-slate-300">Base</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-500">Status</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-900/50 text-green-400">
                    Completed
                  </span>
                </div>
                {txHash && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-slate-500">Transaction</span>
                    <a
                      href={`https://basescan.org/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors"
                    >
                      {txHash.slice(0, 10)}... ↗
                    </a>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* ── Step: failed ─────────────────────────────── */}
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
                <p className="text-base font-semibold text-white">
                  Withdrawal failed
                </p>
                <p className="text-sm text-slate-400 mt-1">{failureMessage}</p>
              </div>
              <p className="text-xs text-slate-500">
                Your balance has not been affected.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setStep("wallet-select");
                    setError("");
                    setFailureMessage("");
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
