import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { bridge } from "@/lib/bridge";

function getToken(req: Request): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ topupId: string }> }
) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topupId } = await params;

  // Fetch the topup, verify ownership and status
  const { data: topup, error: fetchError } = await supabaseAdmin
    .from("topups")
    .select("*, partner_accounts(partner_customer_id)")
    .eq("id", topupId)
    .eq("merchant_id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("Failed to fetch topup:", fetchError.message);
    return NextResponse.json({ error: "Failed to fetch top-up." }, { status: 500 });
  }

  if (!topup) {
    return NextResponse.json({ error: "Top-up not found." }, { status: 404 });
  }

  if (topup.status !== "deposit_received") {
    return NextResponse.json(
      { error: `Cannot convert: top-up status is '${topup.status}'. Deposit must be received first.` },
      { status: 400 }
    );
  }

  const customerId = (topup.partner_accounts as any)?.partner_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: "Partner account not found." }, { status: 400 });
  }

  const eurAmount = topup.eur_amount_received ?? topup.eur_amount_expected;
  if (!eurAmount) {
    return NextResponse.json({ error: "No EUR amount available for conversion." }, { status: 400 });
  }

  let quote: any;
  let transfer: any;

  try {
    // Create a quote for the received EUR amount
    quote = await bridge.createQuote({
      customer_id: customerId,
      source_currency: "eur",
      destination_currency: "usdc",
      source_amount: String(eurAmount),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Bridge createQuote failed:", message);
    return NextResponse.json({ error: "Failed to get conversion quote." }, { status: 502 });
  }

  try {
    // Execute the transfer using the quote
    transfer = await bridge.executeTransfer({
      customer_id: customerId,
      quote_id: quote.id,
      destination_address: topup.destination_wallet,
      destination_chain: "base",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Bridge executeTransfer failed:", message);
    return NextResponse.json({ error: "Failed to execute conversion." }, { status: 502 });
  }

  // Update topup: status → converting, store quote/transfer IDs and amounts
  const { error: updateError } = await supabaseAdmin
    .from("topups")
    .update({
      status: "converting",
      partner_quote_id: quote.id,
      partner_topup_id: transfer.id,
      fx_rate: quote.exchange_rate ?? null,
      usdc_amount: quote.destination_amount ?? null,
      partner_fee_eur: quote.fee ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", topupId);

  if (updateError) {
    console.error("Failed to update topup after conversion start:", updateError.message);
    // Don't fail the response — transfer is already submitted to Bridge
  }

  return NextResponse.json({
    topup_id: topupId,
    status: "converting",
    quoted_usdc_amount: quote.destination_amount ?? null,
    fx_rate: quote.exchange_rate ?? null,
    partner_fee: quote.fee ?? null,
  });
}
