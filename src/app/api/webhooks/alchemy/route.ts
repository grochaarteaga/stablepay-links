import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAddress, isAddress, hexToBigInt } from "viem";
import crypto from "crypto";

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

function verifyAlchemySignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody, "utf8");
  const digest = hmac.digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

// Convert a decimal amount string to USDC units (6 decimals) using BigInt
// to avoid floating-point precision loss.
function amountToUnits(amount: string | number): bigint {
  const [whole, frac = ""] = String(amount).split(".");
  const paddedFrac = frac.slice(0, 6).padEnd(6, "0");
  return BigInt(whole) * BigInt(1_000_000) + BigInt(paddedFrac);
}

function extractLogs(body: any): any[] {
  // Address Activity webhook (recommended — only fires on real activity)
  // Shape: { event: { activity: [{ category, asset, hash, log: { data, topics } }] } }
  // We use log.topics and log.data directly (raw on-chain values) to avoid any
  // unit conversion issues with the higher-level "value" field.
  const activity = body?.event?.activity;
  if (Array.isArray(activity) && activity.length > 0) {
    const usdcAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS?.toLowerCase();
    return activity
      .filter((a: any) =>
        a.category === "token" &&
        a.asset === "USDC" &&
        a.log &&
        // Confirm it's the USDC contract on Base, not another token
        (!usdcAddress || a.log.address?.toLowerCase() === usdcAddress)
      )
      .map((a: any) => ({
        topics: a.log.topics,
        data: a.log.data,
        transaction: { hash: a.hash },
      }));
  }

  // Custom / GraphQL webhook fallback (kept for backwards compatibility)
  return (
    body?.event?.data?.block?.logs ||
    body?.data?.block?.logs ||
    body?.payload?.data?.block?.logs ||
    body?.block?.logs ||
    []
  );
}

export async function POST(req: Request) {
  const started = Date.now();

  // Verify Alchemy webhook signature before processing anything
  const secret = process.env.ALCHEMY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("ALCHEMY_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-alchemy-signature") ?? "";

  if (!verifyAlchemySignature(rawBody, signature, secret)) {
    // Return 200 (not 401) so Alchemy doesn't auto-pause the webhook
    // after repeated failures. We log it but silently discard the payload.
    console.error("Invalid Alchemy webhook signature — payload discarded");
    return NextResponse.json({ ok: false, reason: "invalid_signature" });
  }

  try {
    const body = JSON.parse(rawBody);
    const logs = extractLogs(body);

    if (!Array.isArray(logs) || logs.length === 0) {
      // Important: respond quickly so Alchemy doesn't retry due to timeout
      return NextResponse.json({ ok: true, reason: "no_logs" });
    }

    for (const log of logs) {
      const topics: string[] = log.topics || [];
      const data: string = log.data;
      const txHash: string | undefined = log.transaction?.hash;

      if (!topics || topics.length < 3) continue;
      if ((topics[0] || "").toLowerCase() !== TRANSFER_TOPIC) continue;

      // topics[2] contains the "to" address, padded to 32 bytes
      const toTopic = topics[2];
      const toAddress = "0x" + toTopic.slice(26);

      if (!isAddress(toAddress)) continue;
      const to = getAddress(toAddress); // normalize checksum

      // Amount is in log.data as uint256 hex
      const amountUnits = hexToBigInt(data as `0x${string}`);

      // USDC goes directly to the merchant's Privy wallet — `to` IS the
      // merchant wallet. Find all pending invoices pointing to this address
      // and pick the oldest one whose amount matches the payment.
      const { data: pendingInvoices, error: invError } = await supabaseAdmin
        .from("invoices")
        .select("id, amount, tx_hash, merchant_id")
        .eq("invoice_wallet_address", to)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (invError) {
        console.error("DB error finding invoices:", invError.message);
        continue;
      }
      if (!pendingInvoices || pendingInvoices.length === 0) continue;

      // Match the first invoice whose amount is covered by the payment
      const invoice = pendingInvoices.find(
        (inv) => amountUnits >= amountToUnits(inv.amount)
      );

      if (!invoice) {
        console.log("Payment to", to, "doesn't match any pending invoice amount");
        continue;
      }

      // Mark invoice as paid
      const { error: updError } = await supabaseAdmin
        .from("invoices")
        .update({
          status: "paid",
          tx_hash: txHash || null,
          paid_at: new Date().toISOString(),
        })
        .eq("id", invoice.id)
        .eq("status", "pending"); // extra safety against race conditions

      if (updError) {
        console.error("DB error updating invoice:", updError.message);
        continue;
      }

      // Write credit entry to ledger
      const { error: ledgerError } = await supabaseAdmin
        .from("ledger_entries")
        .insert({
          merchant_id: invoice.merchant_id,
          invoice_id: invoice.id,
          type: "credit",
          amount: invoice.amount,
          tx_hash: txHash || null,
          description: `Payment received for invoice ${invoice.id}`,
        });

      if (ledgerError) {
        console.error("DB error writing ledger entry:", ledgerError.message);
      }

      console.log("Invoice marked as PAID:", invoice.id, "tx:", txHash);
    }

    const ms = Date.now() - started;
    return NextResponse.json({ ok: true, ms });
  } catch (err: any) {
    console.error("Alchemy webhook handler error:", err?.message || err);
    // still return 200 to prevent infinite retries while debugging
    return NextResponse.json({ ok: false, error: "handler_error" });
  }
}
