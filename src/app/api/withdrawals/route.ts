import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPrivyClient } from "@/lib/privy";
import { ensureGasBalance } from "@/lib/gasFunder";
import { encodeFunctionData, getAddress, isAddress } from "viem";

// Inline ABI as const so viem can infer argument types correctly
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

// Convert decimal amount to USDC units (6 decimals) without floating-point loss
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

  const body = await req.json();
  const { wallet_id, amount } = body;

  if (!wallet_id) {
    return NextResponse.json({ error: "wallet_id is required." }, { status: 400 });
  }

  const parsedAmount = parseFloat(String(amount));
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  // Verify the payout wallet belongs to this user
  const { data: payoutWallet } = await supabaseAdmin
    .from("payout_wallets")
    .select("id, wallet_name, address, network")
    .eq("id", wallet_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!payoutWallet) {
    return NextResponse.json({ error: "Wallet not found." }, { status: 404 });
  }

  // Validate the payout address is still valid
  if (!isAddress(payoutWallet.address)) {
    return NextResponse.json({ error: "Invalid destination address." }, { status: 400 });
  }

  // Calculate current available balance from ledger
  const { data: ledgerEntries, error: ledgerFetchError } = await supabaseAdmin
    .from("ledger_entries")
    .select("type, amount")
    .eq("merchant_id", user.id);

  if (ledgerFetchError) {
    return NextResponse.json({ error: "Failed to fetch balance." }, { status: 500 });
  }

  const currentBalance = (ledgerEntries ?? []).reduce((sum: number, e: { type: string; amount: number }) => {
    return sum + (e.type === "credit" ? e.amount : -e.amount);
  }, 0);

  // Round to 6 decimal places to avoid floating-point comparison issues
  const balanceRounded = Math.round(currentBalance * 1_000_000) / 1_000_000;
  const amountRounded = Math.round(parsedAmount * 1_000_000) / 1_000_000;

  if (amountRounded > balanceRounded) {
    return NextResponse.json({ error: "Insufficient balance." }, { status: 400 });
  }

  // Get merchant's Privy wallet (the source of funds)
  const { data: merchantProfile } = await supabaseAdmin
    .from("merchant_profiles")
    .select("privy_wallet_id, wallet_address")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!merchantProfile?.privy_wallet_id) {
    return NextResponse.json(
      { error: "Merchant wallet not configured. Please contact support." },
      { status: 400 }
    );
  }

  // 1. Create withdrawal record (status: pending)
  const { data: withdrawal, error: withdrawalInsertError } = await supabaseAdmin
    .from("withdrawals")
    .insert({
      user_id: user.id,
      wallet_id: payoutWallet.id,
      amount: parsedAmount,
      status: "pending",
    })
    .select()
    .single();

  if (withdrawalInsertError || !withdrawal) {
    console.error("Failed to create withdrawal record:", withdrawalInsertError?.message);
    return NextResponse.json({ error: "Failed to initiate withdrawal." }, { status: 500 });
  }

  const shortDest = `${payoutWallet.address.slice(0, 6)}...${payoutWallet.address.slice(-4)}`;

  // 2. Write debit ledger entry immediately — this reserves the funds
  //    and ensures the balance is accurate even if execution fails
  const { error: debitError } = await supabaseAdmin.from("ledger_entries").insert({
    merchant_id: user.id,
    type: "debit",
    amount: parsedAmount,
    description: `Withdrawal to ${payoutWallet.wallet_name} (${shortDest})`,
  });

  if (debitError) {
    console.error("Failed to write debit ledger entry:", debitError.message);
    // Roll back: delete the pending withdrawal
    await supabaseAdmin.from("withdrawals").delete().eq("id", withdrawal.id);
    return NextResponse.json({ error: "Failed to reserve funds." }, { status: 500 });
  }

  // 3. Mark as processing
  await supabaseAdmin
    .from("withdrawals")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", withdrawal.id);

  // 4. Execute the USDC transfer via Privy server wallet
  try {
    const usdcContractAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS;
    if (!usdcContractAddress) {
      throw new Error("NEXT_PUBLIC_USDC_CONTRACT_ADDRESS is not configured");
    }

    // Ensure merchant wallet has enough ETH for gas on Base.
    // If below the threshold, the gas funder wallet automatically tops it up.
    if (merchantProfile.wallet_address) {
      await ensureGasBalance(merchantProfile.wallet_address);
    }

    const privy = getPrivyClient();
    const amountUnits = amountToUsdcUnits(parsedAmount);

    const calldata = encodeFunctionData({
      abi: USDC_TRANSFER_ABI,
      functionName: "transfer",
      args: [getAddress(payoutWallet.address), amountUnits],
    });

    // Send transaction from the merchant's Privy server wallet
    const { hash } = await privy.walletApi.ethereum.sendTransaction({
      walletId: merchantProfile.privy_wallet_id,
      caip2: "eip155:8453", // Base mainnet — must use caip2, not chainId
      transaction: {
        to: getAddress(usdcContractAddress),
        data: calldata,
        // value omitted — defaults to 0 for ERC-20 transfers (no ETH sent)
      },
    });

    // 5. Mark withdrawal as completed
    await supabaseAdmin
      .from("withdrawals")
      .update({
        status: "completed",
        tx_hash: hash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", withdrawal.id);

    console.log(`Withdrawal completed: ${withdrawal.id} | tx: ${hash} | to: ${payoutWallet.address}`);

    return NextResponse.json({
      id: withdrawal.id,
      status: "completed",
      tx_hash: hash,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Withdrawal execution failed:", message);

    // Mark withdrawal as failed
    await supabaseAdmin
      .from("withdrawals")
      .update({
        status: "failed",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", withdrawal.id);

    // Reverse the debit: write a credit entry to restore the balance
    await supabaseAdmin.from("ledger_entries").insert({
      merchant_id: user.id,
      type: "credit",
      amount: parsedAmount,
      description: `Reversal: withdrawal failed — funds returned to balance`,
    });

    return NextResponse.json(
      {
        error: "Transfer failed. Your balance has been fully restored.",
        status: "failed",
      },
      { status: 500 }
    );
  }
}
