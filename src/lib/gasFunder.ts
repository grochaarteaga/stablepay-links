import { ethers } from "ethers";

const BASE_RPC = "https://mainnet.base.org";

// Keep at least this much ETH in each merchant wallet.
// On Base, a USDC transfer costs ~0.000005 ETH (~$0.01).
// 0.0001 ETH covers ~20 withdrawals before the next top-up.
const MIN_ETH_THRESHOLD = ethers.parseEther("0.0001");

// Amount to send each time we top up.
// 0.0005 ETH (~$1.50 at $3000/ETH) covers ~100 withdrawals.
const TOP_UP_AMOUNT = ethers.parseEther("0.0005");

/**
 * Checks the ETH balance of a merchant's Privy wallet on Base.
 * If below the minimum threshold, tops it up from the PortPagos gas funder wallet.
 *
 * The gas funder wallet is controlled by the GAS_FUNDER_PRIVATE_KEY env var.
 * It should hold a small ETH reserve on Base (e.g. $10–20 worth is enough for
 * thousands of withdrawals given Base's ultra-low gas costs).
 *
 * If GAS_FUNDER_PRIVATE_KEY is not set, a warning is logged and the function
 * returns without topping up — the transfer will proceed and may fail if the
 * wallet has no gas.
 */
export async function ensureGasBalance(merchantWalletAddress: string): Promise<void> {
  const funderPrivateKey = process.env.GAS_FUNDER_PRIVATE_KEY;

  if (!funderPrivateKey) {
    console.warn(
      "[gasFunder] GAS_FUNDER_PRIVATE_KEY is not set — skipping gas check.",
      "Add it to your .env.local to enable automatic gas funding."
    );
    return;
  }

  const provider = new ethers.JsonRpcProvider(BASE_RPC);

  // Check current ETH balance of the merchant wallet
  const currentBalance = await provider.getBalance(merchantWalletAddress);

  if (currentBalance >= MIN_ETH_THRESHOLD) {
    console.log(
      `[gasFunder] Gas OK: ${merchantWalletAddress} has ${ethers.formatEther(currentBalance)} ETH`
    );
    return;
  }

  console.log(
    `[gasFunder] Low gas: ${merchantWalletAddress} has ${ethers.formatEther(currentBalance)} ETH — topping up with ${ethers.formatEther(TOP_UP_AMOUNT)} ETH`
  );

  const funder = new ethers.Wallet(funderPrivateKey, provider);

  // Verify the funder wallet has enough ETH to cover the top-up + its own gas
  const funderBalance = await provider.getBalance(funder.address);
  const requiredFunderBalance = TOP_UP_AMOUNT + ethers.parseEther("0.0001"); // top-up + gas buffer

  if (funderBalance < requiredFunderBalance) {
    throw new Error(
      `[gasFunder] Gas funder wallet (${funder.address}) has insufficient ETH: ` +
      `${ethers.formatEther(funderBalance)} ETH available, need at least ` +
      `${ethers.formatEther(requiredFunderBalance)} ETH. ` +
      `Please fund the gas funder wallet on Base mainnet.`
    );
  }

  const tx = await funder.sendTransaction({
    to: merchantWalletAddress,
    value: TOP_UP_AMOUNT,
  });

  const receipt = await tx.wait();

  console.log(
    `[gasFunder] Top-up complete: sent ${ethers.formatEther(TOP_UP_AMOUNT)} ETH ` +
    `to ${merchantWalletAddress}. tx: ${receipt?.hash}`
  );
}
