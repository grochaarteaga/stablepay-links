import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPrivyClient } from "@/lib/privy";

export async function GET(req: Request) {
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

  // Return existing wallet if already created
  const { data: profile } = await supabaseAdmin
    .from("merchant_profiles")
    .select("wallet_address, privy_wallet_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.wallet_address) {
    return NextResponse.json({ address: profile.wallet_address });
  }

  // Create a new Privy server wallet for this merchant
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
      return NextResponse.json(
        { error: "Failed to save wallet. Make sure the merchant_profiles table exists in Supabase." },
        { status: 500 }
      );
    }

    console.log("Created Privy wallet for merchant:", user.id, wallet.address);

    // Register the merchant wallet with Alchemy so the webhook fires
    // for payments to this address (covers ALL invoices for this merchant)
    const alchemyAuthToken = process.env.ALCHEMY_AUTH_TOKEN;
    const alchemyWebhookId = process.env.ALCHEMY_WEBHOOK_ID;

    if (alchemyAuthToken && alchemyWebhookId) {
      try {
        const alchemyRes = await fetch(
          "https://dashboard.alchemy.com/api/update-webhook-addresses",
          {
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
          }
        );
        if (!alchemyRes.ok) {
          const text = await alchemyRes.text();
          console.error("Failed to register merchant wallet with Alchemy:", text);
        } else {
          console.log("Registered merchant wallet with Alchemy:", wallet.address);
        }
      } catch (alchemyErr) {
        console.error("Error calling Alchemy API:", alchemyErr);
      }
    }

    return NextResponse.json({ address: wallet.address });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to create Privy wallet:", message);
    return NextResponse.json({ error: "Failed to create wallet" }, { status: 500 });
  }
}
