import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { bridge } from "@/lib/bridge";
import { nanoid } from "nanoid";

function getToken(req: Request): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

export async function POST(req: Request) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { amount_eur } = body;

  const parsedAmount = parseFloat(String(amount_eur));
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "amount_eur must be a positive number." }, { status: 400 });
  }

  // Get merchant's Privy wallet address
  const { data: merchantProfile } = await supabaseAdmin
    .from("merchant_profiles")
    .select("wallet_address")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!merchantProfile?.wallet_address) {
    return NextResponse.json(
      { error: "Merchant wallet not configured. Please contact support." },
      { status: 400 }
    );
  }

  // Get or create the partner account (Bridge virtual IBAN)
  let { data: partnerAccount } = await supabaseAdmin
    .from("partner_accounts")
    .select("*")
    .eq("merchant_id", user.id)
    .eq("partner", "bridge")
    .maybeSingle();

  if (!partnerAccount) {
    // Create a new Bridge customer + virtual IBAN
    let bridgeCustomer: { id: string };
    let virtualAccount: { iban?: string; bic?: string; id?: string };

    try {
      // Fetch user email from auth
      const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(user.id);

      bridgeCustomer = await bridge.createCustomer({
        email: authUser?.email ?? user.email ?? "",
        type: "business",
      });

      virtualAccount = await bridge.createVirtualAccount(bridgeCustomer.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Failed to create Bridge customer/account:", message);
      return NextResponse.json(
        { error: "Failed to set up payment account. Please try again." },
        { status: 500 }
      );
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("partner_accounts")
      .insert({
        merchant_id: user.id,
        partner: "bridge",
        partner_customer_id: bridgeCustomer.id,
        virtual_iban: (virtualAccount as any).iban ?? "",
        iban_bic: (virtualAccount as any).bic ?? null,
        status: "active",
      })
      .select()
      .single();

    if (insertError || !inserted) {
      console.error("Failed to insert partner_account:", insertError?.message);
      return NextResponse.json(
        { error: "Failed to set up payment account." },
        { status: 500 }
      );
    }

    partnerAccount = inserted;
  }

  // Generate a unique reference for this top-up
  const reference = `PP-${nanoid(8).toUpperCase()}`;

  // Set expiry 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: topup, error: topupInsertError } = await supabaseAdmin
    .from("topups")
    .insert({
      merchant_id: user.id,
      partner_account_id: partnerAccount.id,
      reference,
      status: "awaiting_deposit",
      eur_amount_expected: parsedAmount,
      destination_wallet: merchantProfile.wallet_address,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (topupInsertError || !topup) {
    console.error("Failed to insert topup:", topupInsertError?.message);
    return NextResponse.json({ error: "Failed to create top-up." }, { status: 500 });
  }

  return NextResponse.json({
    topup_id: topup.id,
    reference,
    status: topup.status,
    sepa_instructions: {
      beneficiary_name: "PortPagos / Bridge",
      iban: partnerAccount.virtual_iban,
      bic: partnerAccount.iban_bic ?? "BOFAUS3N",
      reference,
      amount_eur: parsedAmount,
    },
    expires_at: expiresAt.toISOString(),
  });
}

export async function GET(req: Request) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  let query = supabaseAdmin
    .from("topups")
    .select("*")
    .eq("merchant_id", user.id)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: topups, error } = await query;

  if (error) {
    console.error("Failed to fetch topups:", error.message);
    return NextResponse.json({ error: "Failed to fetch top-ups." }, { status: 500 });
  }

  return NextResponse.json(topups ?? []);
}
