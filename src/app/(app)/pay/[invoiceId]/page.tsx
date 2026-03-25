"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "react-qr-code";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  USDC_ABI,
  USDC_CONTRACT_ADDRESS,
  amountToUsdcUnits,
} from "@/lib/usdc";

type Invoice = {
  id: string;
  amount: number;
  currency: string;
  customer: string | null;
  description: string | null;
  status: string;
  invoice_wallet_address: string | null;
  created_at: string;
};

export default function PayInvoicePage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params.invoiceId;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);


  // Wagmi hooks
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending: isSendingTx } = useWriteContract();

  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // --- Load invoice from backend ---
  useEffect(() => {
    if (!invoiceId) return;

    async function loadInvoice() {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load invoice");
        } else {
          setInvoice(data.invoice as Invoice);
        }
      } catch (err: any) {
        console.error("Error loading invoice:", err.message || err);
        setError("Unexpected error loading invoice");
      } finally {
        setLoading(false);
      }
    }

    loadInvoice();
  }, [invoiceId]);

  async function handlePayWithWallet() {
    setTxError(null);
    setTxHash(null);

    if (!invoice || !invoice.invoice_wallet_address) {
      setTxError("No invoice wallet address available.");
      return;
    }

    if (!USDC_CONTRACT_ADDRESS) {
      setTxError(
        "USDC contract address is not configured. Set NEXT_PUBLIC_USDC_CONTRACT_ADDRESS in .env.local."
      );
      return;
    }

    if (!isConnected) {
      setTxError("Please connect your wallet first using the button above.");
      return;
    }

    if (chainId !== base.id) {
      try {
        await switchChainAsync({ chainId: base.id });
      } catch (err: any) {
        console.error("Error switching chain:", err.message || err);
        setTxError("Failed to switch to Base network.");
        return;
      }
    }

    try {
      const amountUnits = amountToUsdcUnits(invoice.amount);

      const hash = await writeContractAsync({
        address: USDC_CONTRACT_ADDRESS,
        abi: USDC_ABI,
        functionName: "transfer",
        args: [
          invoice.invoice_wallet_address as `0x${string}`,
          amountUnits,
        ],
      });

      setTxHash(hash);
    } catch (err: any) {
      console.error("Error sending transaction:", err.message || err);
      setTxError(err.shortMessage || err.message || "Transaction failed.");
    }
  }

  // --- UI states ---
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p>Loading invoice...</p>
      </main>
    );
  }

  if (error || !invoice) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h1 className="text-2xl font-semibold mb-4">
            Invoice not available
          </h1>
          <p className="text-sm text-slate-300 mb-4">
            {error ||
              "This invoice could not be found. Please contact the merchant."}
          </p>
        </div>
      </main>
    );
  }

  if (invoice.status === "paid") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-green-800 rounded-2xl p-8 space-y-4 text-center">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-semibold text-green-400">
            Payment Received
          </h1>
          <p className="text-slate-300">
            This invoice for{" "}
            <strong>
              {invoice.amount} {invoice.currency || "USDC"}
            </strong>{" "}
            has already been paid.
          </p>
          {invoice.customer && (
            <p className="text-sm text-slate-400">Customer: {invoice.customer}</p>
          )}
          <p className="text-xs text-slate-500 font-mono">
            Invoice {invoice.id.slice(0, 8)}...
          </p>
        </div>
      </main>
    );
  }

  const walletAddress = invoice.invoice_wallet_address;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <header className="space-y-2">
          <p className="text-xs text-slate-400">
            Invoice ID:{" "}
            <span className="font-mono">
              {invoice.id.slice(0, 8)}...
            </span>
          </p>
          <h1 className="text-2xl font-semibold">
            Pay {invoice.amount} {invoice.currency || "USDC"}
          </h1>
          {invoice.customer && (
            <p className="text-sm text-slate-300">
              For: {invoice.customer}
            </p>
          )}
          {invoice.description && (
            <p className="text-sm text-slate-400">
              {invoice.description}
            </p>
          )}
        </header>

        {/* Connect Wallet section */}
        <section className="space-y-2">
          <p className="text-xs text-slate-400">Wallet connection</p>
          {/* Web3Modal connect button */}
          <div className="inline-block">
            {/* custom element provided by Web3Modal */}
            <w3m-button></w3m-button>
          </div>
          {isConnected && (
            <p className="text-xs text-slate-400">
              Connected as{" "}
              <span className="font-mono">
                {connectedAddress?.slice(0, 6)}...
                {connectedAddress?.slice(-4)}
              </span>
            </p>
          )}
        </section>

        <section className="flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-xl">
            {walletAddress ? (
              <QRCode
                value={walletAddress}
                size={140}
                style={{ display: "block" }}
              />
            ) : (
              <div className="w-[140px] h-[140px] flex items-center justify-center text-xs text-slate-500">
                No wallet yet
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3 text-sm">
            <div>
              <p className="text-slate-400 mb-1">Amount due</p>
              <p className="text-lg font-semibold">
                {invoice.amount} {invoice.currency || "USDC"}
              </p>
            </div>

            <div>
              <p className="text-slate-400 mb-1">Wallet address</p>
              {walletAddress ? (
                <div className="space-y-1">
                  <p className="font-mono break-all text-xs bg-slate-800 px-2 py-1 rounded">
                    {walletAddress}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(walletAddress);
                    }}
                    className="text-xs underline text-blue-400"
                  >
                    Copy address
                  </button>
                </div>
              ) : (
                <p className="text-slate-500">
                  The merchant has not yet assigned a payment wallet to this
                  invoice.
                </p>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3">
              <p className="text-slate-400 text-xs mb-1">
                Network & Token
              </p>
              <p className="text-xs">
                Please send <strong>USDC</strong> on the{" "}
                <strong>Base</strong> network only. Sending other tokens
                or using other networks may result in loss of funds.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <button
            className="w-full py-2 rounded-lg bg-blue-600 disabled:opacity-60"
            disabled={!walletAddress || isSendingTx}
            onClick={handlePayWithWallet}
          >
            {isSendingTx ? "Sending transaction..." : "Pay with Wallet"}
          </button>

          {txError && (
            <p className="text-xs text-red-400 mt-1">{txError}</p>
          )}

          {txHash && (
            <p className="text-xs text-green-400 mt-1 break-all">
              Transaction sent: {txHash}
              <br />
              Waiting for confirmation...
            </p>
          )}

          <p className="text-xs text-slate-500">
            Or scan the QR code with your wallet app and send{" "}
            {invoice.amount} {invoice.currency || "USDC"} to the address
            above.
          </p>
        </section>
      </div>
    </main>
  );
}
