import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { bridge } from "@/lib/bridge";

function getToken(req: Request): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ topupId: string }> }
) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topupId } = await params;

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
      { error: `Cannot quote: top-up status is '${topup.status}'. Deposit must be received first.` },
      { status: 400 }
    );
  }

  const customerId = (topup.partner_accounts as any)?.partner_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: "Partner account not found." }, { status: 400 });
  }

  const eurAmount = topup.eur_amount_received ?? topup.eur_amount_expected;
  if (!eurAmount) {
    return NextResponse.json({ error: "No EUR amount available to quote." }, { status: 400 });
  }

  let quote: any;
  try {
    quote = await bridge.createQuote({
      customer_id: customerId,
      source_currency: "eur",
      destination_currency: "usdc",
      source_amount: String(eurAmount),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Bridge createQuote failed:", message);
    return NextResponse.json({ error: "Failed to get quote from Bridge." }, { status: 502 });
  }

  return NextResponse.json({
    fx_rate: quote.exchange_rate ?? null,
    usdc_amount: quote.destination_amount ?? null,
    fee_eur: quote.fee ?? null,
    valid_for_seconds: quote.expires_in ?? null,
  });
}
