import { ethers } from "ethers";
import { decrypt } from "./encryption";
import { USDC_ABI } from "./usdc";

// Public Base Mainnet RPC — no API key required
const BASE_RPC = "https://mainnet.base.org";

export async function sweepToMerchantWallet(
  encryptedPrivateKey: string,
  merchantAddress: string
): Promise<string | null> {
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS;
  if (!usdcAddress) throw new Error("NEXT_PUBLIC_USDC_CONTRACT_ADDRESS not set");

  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  const privateKey = decrypt(encryptedPrivateKey);
  const wallet = new ethers.Wallet(privateKey, provider);

  const usdc = new ethers.Contract(usdcAddress, USDC_ABI, wallet);

  // Check USDC balance
  const balance: bigint = await usdc.balanceOf(wallet.address);
  if (balance === BigInt(0)) {
    console.log("Sweep skipped: no USDC balance in invoice wallet", wallet.address);
    return null;
  }

  // Check ETH balance for gas — Base L2 transactions cost ~$0.01
  const ethBalance = await provider.getBalance(wallet.address);
  if (ethBalance === BigInt(0)) {
    console.warn(
      "Sweep skipped: invoice wallet has no ETH for gas.",
      "Fund this address with a small amount of ETH on Base:",
      wallet.address
    );
    return null;
  }

  const tx = await usdc.transfer(merchantAddress, balance);
  const receipt = await tx.wait();
  console.log(
    `Swept ${balance.toString()} USDC units from ${wallet.address} to ${merchantAddress}. tx: ${receipt.hash}`
  );
  return receipt.hash;
}
