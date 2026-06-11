import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import crypto from "crypto";

const TRANSAK_GATEWAY_BASE =
  process.env.NEXT_PUBLIC_TRANSAK_ENVIRONMENT === "staging"
    ? "https://api-gateway-stg.transak.com"
    : "https://api-gateway.transak.com";

const TRANSAK_PARTNER_BASE =
  process.env.NEXT_PUBLIC_TRANSAK_ENVIRONMENT === "staging"
    ? "https://api-stg.transak.com"
    : "https://api.transak.com";

async function getAccessToken(apiKey: string, apiSecret: string): Promise<string> {
  const res = await fetch(`${TRANSAK_PARTNER_BASE}/partners/api/v2/refresh-token`, {
    method: "POST",
    headers: {
      "api-secret": apiSecret,
      "Content-Type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify({ apiKey }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Transak auth failed: ${err}`);
  }
  const data = await res.json();
  return data?.data?.accessToken;
}

function getToken(req: Request): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

export async function POST(req: Request) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.TRANSAK_API_KEY;
  const apiSecret = process.env.TRANSAK_SECRET_KEY;
  if (!apiKey || !apiSecret) {
    console.error("TRANSAK_API_KEY or TRANSAK_SECRET_KEY is not configured");
    return NextResponse.json({ error: "Off-ramp not configured." }, { status: 500 });
  }

  const body = await req.json();
  const { amount } = body;

  const parsedAmount = parseFloat(String(amount));
  // M1 — server-side minimum/maximum matching the UI constraint
  if (isNaN(parsedAmount) || parsedAmount < 10) {
    return NextResponse.json({ error: "Minimum withdrawal amount is $10." }, { status: 400 });
  }
  if (parsedAmount > 100_000) {
    return NextResponse.json({ error: "Amount exceeds maximum withdrawal limit." }, { status: 400 });
  }

  // Fetch merchant's wallet address
  const { data: merchantProfile } = await supabaseAdmin
    .from("merchant_profiles")
    .select("wallet_address")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!merchantProfile?.wallet_address) {
    return NextResponse.json(
      { error: "Merchant wallet not configured." },
      { status: 400 }
    );
  }

  // Unique order ID ties this widget session to a withdrawal record
  const partnerOrderId = crypto.randomUUID();

  const referrerDomain =
    process.env.NEXT_PUBLIC_TRANSAK_ENVIRONMENT === "staging"
      ? "localhost"
      : "portpagos.com";

  try {
    const accessToken = await getAccessToken(apiKey, apiSecret);

    const response = await fetch(
      `${TRANSAK_GATEWAY_BASE}/api/v2/auth/session`,
      {
        method: "POST",
        headers: {
          "access-token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          widgetParams: {
            apiKey,
            referrerDomain,
            productsAvailed: "SELL",
            cryptoCurrencyCode: "USDC",
            network: "base",
            cryptoAmount: parsedAmount,
            fiatCurrency: "EUR",
            defaultPaymentMethod: "sepa_bank_transfer",
            walletAddress: merchantProfile.wallet_address,
            partnerOrderId,
            hideExchangeScreen: "true",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Transak widget URL creation failed:", errorText);
      return NextResponse.json(
        { error: "Failed to create off-ramp session." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const widgetUrl: string = data?.data?.widgetUrl;

    if (!widgetUrl) {
      console.error("Transak response missing widgetUrl:", JSON.stringify(data));
      return NextResponse.json(
        { error: "Invalid response from off-ramp provider." },
        { status: 502 }
      );
    }

    // Bind this widget session to a server-side withdrawal record so /execute
    // can take the amount from HERE, not from the (tamperable) postMessage body.
    const { error: sessionError } = await supabaseAdmin.from("withdrawals").insert({
      user_id: user.id,
      amount: parsedAmount,
      status: "session_created",
      type: "fiat",
      partner_order_id: partnerOrderId,
    });

    if (sessionError) {
      console.error("Failed to record off-ramp session:", sessionError.message);
      return NextResponse.json({ error: "Failed to create off-ramp session." }, { status: 500 });
    }

    return NextResponse.json({ widgetUrl, partnerOrderId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Transak widget URL error:", message);
    return NextResponse.json({ error: "Off-ramp unavailable." }, { status: 500 });
  }
}
