import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPrivyClient } from "@/lib/privy";
import { encodeFunctionData, getAddress, isAddress } from "viem";
import crypto from "crypto";

const USDC_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;

function amountToUsdcUnits(amount: number): bigint {
  const [whole, frac = ""] = amount.toFixed(6).split(".");
  return BigInt(whole) * BigInt(1_000_000) + BigInt(frac.slice(0, 6).padEnd(6, "0"));
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

  // M4 — guard env var before any stateful DB work
  const usdcContractAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS;
  if (!usdcContractAddress) {
    console.error("NEXT_PUBLIC_USDC_CONTRACT_ADDRESS is not configured");
    return NextResponse.json({ error: "Service misconfigured." }, { status: 500 });
  }

  const body = await req.json();
  const { deposit_address, amount, partner_order_id } = body;

  if (!deposit_address || !isAddress(deposit_address)) {
    return NextResponse.json({ error: "Invalid deposit address." }, { status: 400 });
  }
  if (!partner_order_id) {
    return NextResponse.json({ error: "partner_order_id is required." }, { status: 400 });
  }

  const parsedAmount = parseFloat(String(amount));
  // M1 — enforce server-side minimum matching the UI constraint
  if (isNaN(parsedAmount) || parsedAmount < 10) {
    return NextResponse.json({ error: "Minimum withdrawal amount is $10." }, { status: 400 });
  }
  if (parsedAmount > 100_000) {
    return NextResponse.json({ error: "Amount exceeds maximum withdrawal limit." }, { status: 400 });
  }

  // Guard against duplicate executions for the same Transak order
  const { data: existing } = await supabaseAdmin
    .from("withdrawals")
    .select("id, status")
    .eq("partner_order_id", partner_order_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Order already being processed.", withdrawal_id: existing.id },
      { status: 409 }
    );
  }

  // Read current balance
  const { data: balanceRow } = await supabaseAdmin
    .from("balances")
    .select("amount")
    .eq("merchant_id", user.id)
    .maybeSingle();

  const currentBalance = Number(balanceRow?.amount ?? 0);
  const balanceRounded = Math.round(currentBalance * 1_000_000) / 1_000_000;
  const amountRounded = Math.round(parsedAmount * 1_000_000) / 1_000_000;

  if (amountRounded > balanceRounded) {
    return NextResponse.json({ error: "Insufficient balance." }, { status: 400 });
  }

  // Get merchant's Privy wallet
  const { data: merchantProfile } = await supabaseAdmin
    .from("merchant_profiles")
    .select("privy_wallet_id, wallet_address")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!merchantProfile?.privy_wallet_id) {
    return NextResponse.json(
      { error: "Merchant wallet not configured." },
      { status: 400 }
    );
  }

  // 1. Create withdrawal record (type: fiat — off-ramp via Transak)
  const { data: withdrawal, error: withdrawalInsertError } = await supabaseAdmin
    .from("withdrawals")
    .insert({
      user_id: user.id,
      amount: parsedAmount,
      status: "pending",
      type: "fiat",
      partner_order_id,
    })
    .select()
    .single();

  if (withdrawalInsertError || !withdrawal) {
    console.error("Failed to create withdrawal record:", withdrawalInsertError?.message);
    return NextResponse.json({ error: "Failed to initiate withdrawal." }, { status: 500 });
  }

  const ledgerTxId = crypto.randomUUID();
  const shortDest = `${deposit_address.slice(0, 6)}...${deposit_address.slice(-4)}`;

  // 2. Write debit ledger entry — reserves the funds.
  // C1: the balances_amount_non_negative CHECK constraint (migration 004) is the
  // atomic backstop against concurrent overdraft. If two requests race past the
  // balance read above, the trigger that updates balances will reject the second
  // debit with a constraint violation (23514), caught here as debitError.
  const { error: debitError } = await supabaseAdmin.from("ledger_entries").insert({
    merchant_id: user.id,
    type: "debit",
    amount: parsedAmount,
    description: `Fiat off-ramp via Transak (${shortDest})`,
    idempotency_key: `withdrawal:${withdrawal.id}:debit`,
    ledger_transaction_id: ledgerTxId,
    metadata: {
      withdrawal_id: withdrawal.id,
      partner_order_id,
      deposit_address,
      type: "transak_offramp",
    },
  });

  if (debitError) {
    console.error("Failed to write debit ledger entry:", debitError.message);
    await supabaseAdmin.from("withdrawals").delete().eq("id", withdrawal.id);
    // 23514 = check_violation (balance went negative — concurrent overdraft)
    const isInsufficientFunds = debitError.code === "23514";
    return NextResponse.json(
      { error: isInsufficientFunds ? "Insufficient balance." : "Failed to reserve funds." },
      { status: isInsufficientFunds ? 400 : 500 }
    );
  }

  // H3: status update and USDC send are both inside the try/catch so a process
  // kill at any point after the debit triggers the reversal in the catch block.
  try {
    // 3. Mark as processing
    await supabaseAdmin
      .from("withdrawals")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", withdrawal.id);

    // 4. Send USDC from merchant's Privy wallet to Transak's deposit address
    const privy = getPrivyClient();
    const amountUnits = amountToUsdcUnits(parsedAmount);

    const calldata = encodeFunctionData({
      abi: USDC_TRANSFER_ABI,
      functionName: "transfer",
      args: [getAddress(deposit_address), amountUnits],
    });

    const { hash } = await privy.walletApi.ethereum.sendTransaction({
      walletId: merchantProfile.privy_wallet_id,
      caip2: "eip155:8453",
      transaction: {
        to: getAddress(usdcContractAddress),
        data: calldata,
      },
      sponsor: true,
    });

    // 5. Store tx_hash — Transak webhook marks the withdrawal completed
    await supabaseAdmin
      .from("withdrawals")
      .update({ tx_hash: hash, updated_at: new Date().toISOString() })
      .eq("id", withdrawal.id);

    console.log(`Transak USDC sent: withdrawal ${withdrawal.id} | tx: ${hash} | to: ${deposit_address}`);

    return NextResponse.json({ id: withdrawal.id, status: "processing", tx_hash: hash });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Transak execute failed:", message);

    await supabaseAdmin
      .from("withdrawals")
      .update({ status: "failed", error_message: message, updated_at: new Date().toISOString() })
      .eq("id", withdrawal.id);

    // Reverse the debit. idempotency_key is shared with the ORDER_FAILED webhook
    // reversal path — 23505 on either side means the other already reversed. Do not
    // change this key in one place without changing the other (webhooks/transak/route.ts).
    const { error: reversalError } = await supabaseAdmin.from("ledger_entries").insert({
      merchant_id: user.id,
      type: "credit",
      amount: parsedAmount,
      description: "Reversal: Transak USDC send failed — funds returned to balance",
      idempotency_key: `withdrawal:${withdrawal.id}:reversal`,
      ledger_transaction_id: ledgerTxId,
      metadata: { withdrawal_id: withdrawal.id, reason: "usdc_send_failed", error: message },
    });

    if (reversalError && reversalError.code !== "23505") {
      console.error("Failed to write reversal entry:", reversalError.message);
    }

    return NextResponse.json(
      { error: "Failed to send USDC. Your balance has been fully restored." },
      { status: 500 }
    );
  }
}
