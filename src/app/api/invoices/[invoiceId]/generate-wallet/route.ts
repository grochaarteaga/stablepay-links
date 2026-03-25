// src/app/api/invoices/[invoiceId]/generate-wallet/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPrivyClient } from "@/lib/privy";

export async function POST(
  req: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await context.params;

  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
  }

  // Verify the caller is an authenticated merchant
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch the invoice and verify ownership
    const { data: invoice, error: fetchError } = await supabaseAdmin
      .from("invoices")
      .select("id, invoice_wallet_address")
      .eq("id", invoiceId)
      .eq("merchant_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching invoice:", fetchError.message);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 2. Idempotency: already assigned
    if (invoice.invoice_wallet_address) {
      return NextResponse.json({ address: invoice.invoice_wallet_address });
    }

    // 3. Use the merchant's Privy wallet as the payment destination.
    //    USDC goes directly from customer → merchant wallet.
    //    No intermediate invoice wallet, no sweep, no gas needed from our side.
    const { data: profile } = await supabaseAdmin
      .from("merchant_profiles")
      .select("wallet_address")
      .eq("user_id", user.id)
      .maybeSingle();

    let address = profile?.wallet_address ?? null;

    // If no wallet exists yet, create one automatically (same logic as
    // GET /api/merchant/wallet — handles the case where the merchant hasn't
    // visited the dashboard yet, or the previous insert failed)
    if (!address) {
      try {
        const privy = getPrivyClient();
        const wallet = await privy.walletApi.createWallet({ chainType: "ethereum" });

        const { error: insertError } = await supabaseAdmin
          .from("merchant_profiles")
          .insert({
            user_id: user.id,
            privy_wallet_id: wallet.id,
            wallet_address: wallet.address,
          });

        if (insertError) {
          console.error("Failed to save merchant profile:", insertError.message);
          return NextResponse.json({ error: "Failed to create merchant wallet" }, { status: 500 });
        }

        // Also register with Alchemy so the webhook watches this address
        const alchemyAuthToken = process.env.ALCHEMY_AUTH_TOKEN;
        const alchemyWebhookId = process.env.ALCHEMY_WEBHOOK_ID;
        if (alchemyAuthToken && alchemyWebhookId) {
          await fetch("https://dashboard.alchemy.com/api/update-webhook-addresses", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "X-Alchemy-Token": alchemyAuthToken,
            },
            body: JSON.stringify({
              webhook_id: alchemyWebhookId,
              addresses_to_add: [wallet.address],
              addresses_to_remove: [],
            }),
          }).catch((err) => console.error("Failed to register with Alchemy:", err));
        }

        address = wallet.address;
        console.log("Auto-created Privy wallet for merchant:", user.id, address);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Failed to create Privy wallet:", message);
        return NextResponse.json({ error: "Failed to create merchant wallet" }, { status: 500 });
      }
    }

    // 4. Assign the merchant wallet address to this invoice
    const { error: updateError } = await supabaseAdmin
      .from("invoices")
      .update({ invoice_wallet_address: address })
      .eq("id", invoiceId)
      .eq("merchant_id", user.id);

    if (updateError) {
      console.error("Error updating invoice:", updateError.message);
      return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
    }

    return NextResponse.json({ address });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error assigning wallet:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
