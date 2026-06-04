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

// Minimum invoice amount for bank transfer (Transak minimum order ~€30)
const MIN_AMOUNT = 30;

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

// Public route — no merchant auth required (payer is not a PortPagos user)
export async function POST(req: Request) {
  const apiKey = process.env.TRANSAK_API_KEY;
  const apiSecret = process.env.TRANSAK_SECRET_KEY;
  if (!apiKey || !apiSecret) {
    console.error("TRANSAK_API_KEY or TRANSAK_SECRET_KEY is not configured");
    return NextResponse.json({ error: "Payment service unavailable." }, { status: 500 });
  }

  const body = await req.json();
  const { invoiceId } = body;

  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId is required." }, { status: 400 });
  }

  // Fetch invoice — use admin client to read without merchant session
  const { data: invoice } = await supabaseAdmin
    .from("invoices")
    .select("id, amount, status, invoice_wallet_address")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  if (["paid", "cancelled", "expired", "failed"].includes(invoice.status)) {
    return NextResponse.json({ error: "Invoice is no longer payable." }, { status: 409 });
  }

  if (!invoice.invoice_wallet_address) {
    return NextResponse.json({ error: "Invoice has no receiving address." }, { status: 400 });
  }

  if (invoice.amount < MIN_AMOUNT) {
    return NextResponse.json(
      { error: `Minimum amount for bank transfer is $${MIN_AMOUNT}.` },
      { status: 400 }
    );
  }

  const partnerOrderId = crypto.randomUUID();
  const referrerDomain =
    process.env.NEXT_PUBLIC_TRANSAK_ENVIRONMENT === "staging"
      ? "localhost"
      : "portpagos.com";

  try {
    const accessToken = await getAccessToken(apiKey, apiSecret);

    const response = await fetch(`${TRANSAK_GATEWAY_BASE}/api/v2/auth/session`, {
      method: "POST",
      headers: {
        "access-token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        widgetParams: {
          apiKey,
          referrerDomain,
          productsAvailed: "BUY",
          cryptoCurrencyCode: "USDC",
          network: "base",
          cryptoAmount: invoice.amount,
          fiatCurrency: "EUR",
          defaultPaymentMethod: "sepa_bank_transfer",
          // Transak sends USDC directly to the merchant's invoice wallet
          walletAddress: invoice.invoice_wallet_address,
          partnerOrderId,
          hideExchangeScreen: "true",
          disableWalletAddressForm: "true",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Transak on-ramp widget URL creation failed:", errorText);
      return NextResponse.json({ error: "Failed to create payment session." }, { status: 502 });
    }

    const data = await response.json();
    const widgetUrl: string = data?.data?.widgetUrl;

    if (!widgetUrl) {
      console.error("Transak on-ramp response missing widgetUrl:", JSON.stringify(data));
      return NextResponse.json({ error: "Invalid response from payment provider." }, { status: 502 });
    }

    return NextResponse.json({ widgetUrl, partnerOrderId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Transak on-ramp error:", message);
    return NextResponse.json({ error: "Payment service unavailable." }, { status: 500 });
  }
}
