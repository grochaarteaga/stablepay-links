"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function NewInvoicePage() {
  const [amount, setAmount] = useState("");
  const [customer, setCustomer] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setMessage("Please enter a valid amount greater than 0.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must be logged in to create an invoice.");
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
          customer: customer || null,
          description: description || null,
          // status defaults to 'pending'
          // currency defaults to 'USDC'
        },
      ])
      .select("id")
      .single();

    if (error || !created) {
      console.error("Error creating invoice:", error?.message);
      setMessage("Error creating invoice: " + error?.message);
      setSubmitting(false);
      return;
    }

    // Automatically generate a wallet for the new invoice
    setMessage("Generating payment wallet...");
    const { data: { session } } = await supabase.auth.getSession();
    const walletRes = await fetch(
      `/api/invoices/${created.id}/generate-wallet`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      }
    );

    if (!walletRes.ok) {
      console.error("Error generating wallet for invoice:", created.id);
      // Non-fatal: invoice was created, wallet can be generated from dashboard
    }

    // Success → go back to dashboard
    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h1 className="text-2xl font-semibold mb-4">New Invoice</h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Amount (USDC)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full p-2 rounded bg-slate-800 border border-slate-700"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Customer (optional)
            </label>
            <input
              type="text"
              className="w-full p-2 rounded bg-slate-800 border border-slate-700"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Customer name or reference"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Description (optional)
            </label>
            <textarea
              className="w-full p-2 rounded bg-slate-800 border border-slate-700"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this invoice for?"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded bg-green-600 hover:bg-green-500 disabled:opacity-60"
          >
            {submitting ? "Creating invoice & wallet..." : "Create Invoice"}
          </button>
        </form>

        {message && (
          <p className="text-sm text-red-400 mt-3">{message}</p>
        )}

        <p className="text-sm mt-4">
          <Link href="/dashboard" className="text-blue-400 underline">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
