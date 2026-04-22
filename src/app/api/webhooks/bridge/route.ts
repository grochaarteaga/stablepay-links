import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import crypto from "crypto";

function verifyBridgeSignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody, "utf8");
  const digest = hmac.digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const secret = process.env.BRIDGE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("BRIDGE_WEBHOOK_SECRET is not configured");
    // Return 200 to prevent Bridge from auto-pausing the webhook
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-bridge-signature") ?? "";

  if (!verifyBridgeSignature(rawBody, signature, secret)) {
    console.error("Invalid Bridge webhook signature — payload discarded");
    // Return 200 (not 401) so Bridge doesn't auto-pause the webhook
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    console.error("Bridge webhook: failed to parse JSON body");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const eventType: string = body?.event_type ?? body?.type ?? "";
  const partnerEventId: string | undefined = body?.id;

  // Look up the topup by reference (included in most Bridge callbacks)
  // Bridge includes the transfer reference in the webhook payload.
  const reference: string | undefined =
    body?.reference ??
    body?.data?.reference ??
    body?.transfer?.reference;

  try {
    let topupId: string | null = null;

    if (reference) {
      const { data: topup } = await supabaseAdmin
        .from("topups")
        .select("id")
        .eq("reference", reference)
        .maybeSingle();

      topupId = topup?.id ?? null;
    }

    // Always insert into topup_events for the audit log
    await supabaseAdmin.from("topup_events").insert({
      topup_id: topupId,
      event_type: eventType,
      partner_event_id: partnerEventId ?? null,
      payload: body,
    });

    if (!topupId) {
      console.warn(`Bridge webhook: no topup found for reference '${reference}' (event: ${eventType})`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    switch (eventType) {
      case "deposit_received": {
        const eurReceived =
          body?.amount ??
          body?.data?.amount ??
          body?.deposit?.amount ??
          null;

        await supabaseAdmin
          .from("topups")
          .update({
            status: "deposit_received",
            eur_amount_received: eurReceived ? parseFloat(String(eurReceived)) : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", topupId);

        break;
      }

      case "conversion_completed": {
        const fxRate =
          body?.exchange_rate ??
          body?.data?.exchange_rate ??
          null;
        const usdcAmount =
          body?.destination_amount ??
          body?.data?.destination_amount ??
          null;

        await supabaseAdmin
          .from("topups")
          .update({
            status: "converted",
            fx_rate: fxRate ? parseFloat(String(fxRate)) : null,
            usdc_amount: usdcAmount ? parseFloat(String(usdcAmount)) : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", topupId);

        break;
      }

      case "payout_completed": {
        const txHash =
          body?.tx_hash ??
          body?.data?.tx_hash ??
          body?.transaction_hash ??
          null;
        const usdcAmount =
          body?.destination_amount ??
          body?.data?.destination_amount ??
          null;

        // Fetch the topup to get merchant_id and usdc_amount (may already be set)
        const { data: topup } = await supabaseAdmin
          .from("topups")
          .select("merchant_id, usdc_amount")
          .eq("id", topupId)
          .maybeSingle();

        if (!topup) break;

        const finalUsdc = usdcAmount
          ? parseFloat(String(usdcAmount))
          : (topup.usdc_amount ?? null);

        // Mark topup completed
        await supabaseAdmin
          .from("topups")
          .update({
            status: "completed",
            tx_hash: txHash ?? null,
            usdc_amount: finalUsdc,
            updated_at: new Date().toISOString(),
          })
          .eq("id", topupId);

        // Write credit to ledger so the dashboard balance updates.
        // idempotency_key on partnerEventId prevents a double credit
        // if Bridge replays the payout_completed webhook.
        if (finalUsdc) {
          const { error: ledgerError } = await supabaseAdmin
            .from("ledger_entries")
            .insert({
              merchant_id: topup.merchant_id,
              type: "credit",
              amount: finalUsdc,
              tx_hash: txHash ?? null,
              description: "EUR top-up via Bridge",
              idempotency_key: partnerEventId ? `bridge:event:${partnerEventId}` : null,
              metadata: {
                topup_id: topupId,
                partner_event_id: partnerEventId ?? null,
              },
            });

          if (ledgerError) {
            if (ledgerError.code === "23505") {
              // unique_violation: entry already exists — idempotent, safe to ignore
              console.log(`Ledger entry already exists for Bridge event ${partnerEventId} — skipping duplicate`);
            } else {
              console.error("Bridge webhook: failed to write ledger credit:", ledgerError.message);
            }
          }
        }

        break;
      }

      case "payout_failed": {
        const errorMessage =
          body?.error ??
          body?.data?.error ??
          body?.failure_reason ??
          "Payout failed";

        await supabaseAdmin
          .from("topups")
          .update({
            status: "failed",
            error_message: String(errorMessage),
            updated_at: new Date().toISOString(),
          })
          .eq("id", topupId);

        break;
      }

      case "deposit_returned": {
        await supabaseAdmin
          .from("topups")
          .update({
            status: "failed",
            error_message: "EUR returned to sender",
            updated_at: new Date().toISOString(),
          })
          .eq("id", topupId);

        break;
      }

      default: {
        console.log(`Bridge webhook: unhandled event type '${eventType}' for topup ${topupId}`);
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Bridge webhook handler error:", message);
    // Still return 200 to prevent Bridge from auto-pausing the webhook
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
