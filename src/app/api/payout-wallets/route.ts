import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAddress, getAddress } from "viem";

function getToken(req: Request): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

async function getAuthUser(token: string) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(req: Request) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getAuthUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("payout_wallets")
    .select("id, wallet_name, address, network, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getAuthUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { wallet_name, address, network } = body;

  if (!wallet_name?.trim()) {
    return NextResponse.json({ error: "Wallet name is required." }, { status: 400 });
  }
  if (!address?.trim()) {
    return NextResponse.json({ error: "Wallet address is required." }, { status: 400 });
  }
  if (!isAddress(address)) {
    return NextResponse.json({ error: "Invalid Ethereum address." }, { status: 400 });
  }

  const normalizedAddress = getAddress(address.trim());

  // Prevent duplicate addresses per user
  const { data: existing } = await supabaseAdmin
    .from("payout_wallets")
    .select("id")
    .eq("user_id", user.id)
    .eq("address", normalizedAddress)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "This wallet address is already saved." },
      { status: 409 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("payout_wallets")
    .insert({
      user_id: user.id,
      wallet_name: wallet_name.trim(),
      address: normalizedAddress,
      network: network || "base",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
