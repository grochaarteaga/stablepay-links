// src/lib/usdc.ts
import { getAddress } from "viem";

const raw = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS;

export const USDC_CONTRACT_ADDRESS = raw
  ? (getAddress(raw.trim() as `0x${string}`) as `0x${string}`)
  : undefined;

export const USDC_ABI = [
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
];

// Convert a decimal amount (e.g., 12.34) to USDC units (6 decimals) as bigint
export function amountToUsdcUnits(amount: number): bigint {
  const [intPart, fracPartRaw = ""] = amount.toString().split(".");
  const fracPart = fracPartRaw.padEnd(6, "0").slice(0, 6); // 6 decimals for USDC

  const full = `${intPart}${fracPart}`;
  return BigInt(full);
}
