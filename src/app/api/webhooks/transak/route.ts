import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import * as jose from "jose";
import crypto from "crypto";

// Transak signs the `data` field as a JWT using the API secret as the HS256 key.
async function decodeWebhookData(data: string, apiSecret: string): Promise<Record<string, unknown>> {
  const secret = new TextEncoder().encode(apiSecret);
  const { payload } = await jose.jwtVerify(data, secret, { algorithms: ["HS256"] });
  return payload as Record<string, unknown>;
}

export async function POST(req: Request) {
  const apiSecret = process.env.TRANSAK_SECRET_KEY;
  if (!apiSecret) {
    console.error("TRANSAK_SECRET_KEY is not configured");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const rawBody = await req.text();

  let body: { data?: string; eventID?: string };
  try {
    body = JSON.parse(rawBody);
  } catch {
    console.error("Transak webhook: failed to parse JSON body");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (!body.data) {
    console.error("Transak webhook: missing data field");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  let webhookPayload: Record<string, unknown>;
  try {
    webhookPayload = await decodeWebhookData(body.data, apiSecret);
  } catch (err) {
    console.error("Transak webhook: JWT verification failed —", err);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // H2: replay-window check — reject JWTs older than 5 minutes
  const iat = webhookPayload.iat as number | undefined;
  if (iat && Date.now() / 1000 - iat > 300) {
    console.error(`Transak webhook: stale JWT rejected (iat=${iat})`);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const webhookData = webhookPayload.webhookData as Record<string, unknown> | undefined;

  // M2: eventID must be present — do not silently fall back to empty string
  const eventId: string = (body.eventID ?? webhookPayload.eventID ?? "") as string;
  if (!eventId) {
    console.error("Transak webhook: missing eventID in payload");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const partnerOrderId: string = (webhookData?.partnerOrderId ?? "") as string;

  if (!partnerOrderId) {
    console.error("Transak webhook: missing partnerOrderId in payload");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Look up the withdrawal by partnerOrderId
  const { data: withdrawal, error: fetchError } = await supabaseAdmin
    .from("withdrawals")
    .select("id, user_id, amount, status")
    .eq("partner_order_id", partnerOrderId)
    .maybeSingle();

  if (fetchError || !withdrawal) {
    console.error(`Transak webhook: no withdrawal found for partnerOrderId ${partnerOrderId}`);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Skip if already in a terminal state (idempotency guard)
  if (withdrawal.status === "completed" || withdrawal.status === "failed") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    if (eventId === "ORDER_COMPLETED") {
      const txHash = (webhookData?.transactionHash ?? webhookData?.txHash ?? "") as string;

      await supabaseAdmin
        .from("withdrawals")
        .update({
          status: "completed",
          tx_hash: txHash || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.id);

      console.log(`Transak off-ramp completed: withdrawal ${withdrawal.id} | partnerOrderId: ${partnerOrderId}`);

    } else if (eventId === "ORDER_FAILED") {
      const reason = (webhookData?.statusReason ?? "Order failed") as string;

      await supabaseAdmin
        .from("withdrawals")
        .update({
          status: "failed",
          error_message: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.id);

      // Reverse the ledger debit — restores the merchant's balance
      const idempotencyKey = `withdrawal:${withdrawal.id}:reversal`;
      const { error: reversalError } = await supabaseAdmin.from("ledger_entries").insert({
        merchant_id: withdrawal.user_id,
        type: "credit",
        amount: withdrawal.amount,
        description: "Reversal: Transak off-ramp failed — funds returned to balance",
        idempotency_key: idempotencyKey,
        ledger_transaction_id: crypto.randomUUID(),
        metadata: {
          withdrawal_id: withdrawal.id,
          partner_order_id: partnerOrderId,
          reason,
        },
      });

      if (reversalError && reversalError.code !== "23505") {
        console.error("Transak webhook: failed to write reversal entry:", reversalError.message);
      }

      console.log(`Transak off-ramp failed: withdrawal ${withdrawal.id} | reason: ${reason}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Transak webhook processing error:", message);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
