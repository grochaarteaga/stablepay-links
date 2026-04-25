"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Step = "form" | "success";

type SuccessData = {
  invoiceId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
};

export default function NewInvoicePage() {
  const [step, setStep] = useState<Step>("form");

  const [amount, setAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const [emailInput, setEmailInput] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [copied, setCopied] = useState(false);

  function resetAll() {
    setStep("form");
    setAmount("");
    setCustomerName("");
    setCustomerEmail("");
    setDescription("");
    setSubmitting(false);
    setFormError(null);
    setSuccessData(null);
    setEmailInput("");
    setEmailSending(false);
    setEmailResult(null);
    setCopied(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFormError("You must be logged in to create an invoice.");
      setSubmitting(false);
      window.location.href = "/login";
      return;
    }

    const { data: created, error } = await supabase
      .from("invoices")
      .insert([
        {
          merchant_id: user.id,
          amount: parsedAmount,
          customer: customerName || null,
          description: description || null,
        },
      ])
      .select("id")
      .single();

    if (error || !created) {
      setFormError("Error creating invoice: " + error?.message);
      setSubmitting(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`/api/invoices/${created.id}/generate-wallet`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
    }).catch(() => null);

    setSuccessData({
      invoiceId: created.id,
      amount: parsedAmount,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
    });
    setEmailInput(customerEmail.trim());
    setStep("success");
    setSubmitting(false);
  }

  async function handleSendEmail() {
    if (!successData || !emailInput.trim()) return;
    setEmailSending(true);
    setEmailResult(null);

    const { data: { session } } = await supabase.auth.getSession();

    try {
      const res = await fetch(`/api/invoices/${successData.invoiceId}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ customer_email: emailInput.trim() }),
      });

      if (res.ok) {
        setEmailResult({ ok: true, message: `Sent to ${emailInput.trim()}` });
      } else {
        const body = await res.json().catch(() => ({}));
        setEmailResult({ ok: false, message: body.error || "Failed to send email." });
      }
    } catch {
      setEmailResult({ ok: false, message: "Network error. Please try again." });
    } finally {
      setEmailSending(false);
    }
  }

  async function handleCopyLink() {
    if (!successData) return;
    const url = `${window.location.origin}/pay/${successData.invoiceId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const paymentLink = successData
    ? `${window.location.origin}/pay/${successData.invoiceId}`
    : "";

  const whatsappUrl = successData
    ? `https://wa.me/?text=${encodeURIComponent(
        `Payment request: $${successData.amount.toFixed(2)} USDC\n${paymentLink}`
      )}`
    : "";

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6">

        {step === "form" && (
          <>
            <h1 className="text-xl font-semibold mb-5">New invoice</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Customer name <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Maersk Line, Port of Rotterdam"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Customer email <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@company.com"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Amount (USDC)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full pl-7 pr-16 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                    USDC
                  </span>
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
                  placeholder="e.g. Port handling fees — March 2025"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                />
              </div>

              {formError && (
                <div className="px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {submitting ? "Creating..." : "Create invoice →"}
              </button>
            </form>

            <p className="text-sm mt-5">
              <Link
                href="/dashboard"
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                ← Back to dashboard
              </Link>
            </p>
          </>
        )}

        {step === "success" && successData && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-green-600/10 border border-green-600/20 shrink-0">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-400"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold">Invoice created</p>
                <p className="text-sm text-slate-400 mt-0.5">
                  ${successData.amount.toFixed(2)} USDC
                  {successData.customerName && (
                    <> &middot; {successData.customerName}</>
                  )}
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-800" />

            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">
                Payment link
              </p>
              <div className="px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 mb-2 overflow-hidden">
                <p className="text-xs font-mono text-slate-300 truncate">
                  {paymentLink}
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-sm font-medium transition-colors"
              >
                {copied ? "✓ Copied!" : "Copy link"}
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Share this link with your customer — they pay directly from their account.
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 mt-1">
                Send by email
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="customer@company.com"
                  className="flex-1 px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors min-w-0"
                />
                <button
                  onClick={handleSendEmail}
                  disabled={emailSending || !emailInput.trim()}
                  className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600 text-sm font-medium transition-colors shrink-0 whitespace-nowrap"
                >
                  {emailSending ? "Sending..." : "Send invoice"}
                </button>
              </div>
              {emailResult && (
                <p
                  className={`text-xs mt-2 ${
                    emailResult.ok ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {emailResult.ok ? `✓ ${emailResult.message}` : emailResult.message}
                </p>
              )}
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm font-medium text-center transition-colors"
            >
              Share via WhatsApp
            </a>

            <div className="h-px bg-slate-800" />

            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Create another
              </button>
              <button
                onClick={() => { window.location.href = "/dashboard"; }}
                className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium transition-colors"
              >
                Go to dashboard →
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
