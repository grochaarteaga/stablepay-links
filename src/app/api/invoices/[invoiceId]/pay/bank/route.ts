import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BLOCKED_STATUSES = ["paid", "cancelled", "expired", "failed", "pending_bank_transfer"];

export async function POST(
  req: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await context.params;

  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
  }

  const body = await req.json();
  const { email } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  // Fetch invoice (service role — public pay page, no auth)
  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from("invoices")
    .select("id, status, amount, merchant_id")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  if (BLOCKED_STATUSES.includes(invoice.status)) {
    return NextResponse.json(
      { error: `Invoice is ${invoice.status} and cannot be paid.` },
      { status: 409 }
    );
  }

  // Generate a human-readable reference number: INV- + last 8 chars of UUID
  const reference = `INV-${invoiceId.slice(-8).toUpperCase()}`;

  // Record the payment attempt
  const { error: attemptError } = await supabaseAdmin
    .from("invoice_payment_attempts")
    .insert({
      invoice_id: invoiceId,
      merchant_id: invoice.merchant_id,
      method: "bank",
      payer_email: email.toLowerCase().trim(),
      reference,
    });

  if (attemptError) {
    console.error("Failed to record payment attempt:", attemptError.message);
    return NextResponse.json({ error: "Failed to record payment attempt." }, { status: 500 });
  }

  // Update invoice status to pending_bank_transfer so it cannot be paid again
  const { error: updateError } = await supabaseAdmin
    .from("invoices")
    .update({ status: "pending_bank_transfer" })
    .eq("id", invoiceId);

  if (updateError) {
    console.error("Failed to update invoice status:", updateError.message);
    // Non-fatal — attempt was already recorded. Return success anyway.
  }

  return NextResponse.json({ reference });
}
