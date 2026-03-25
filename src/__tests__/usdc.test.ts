import { describe, it, expect } from "vitest";
import { amountToUsdcUnits } from "@/lib/usdc";

describe("amountToUsdcUnits", () => {
  it("converts whole numbers", () => {
    expect(amountToUsdcUnits(100)).toBe(BigInt(100_000_000));
  });

  it("converts amounts with fewer than 6 decimal places", () => {
    expect(amountToUsdcUnits(12.34)).toBe(BigInt(12_340_000));
    expect(amountToUsdcUnits(0.5)).toBe(BigInt(500_000));
    expect(amountToUsdcUnits(1.1)).toBe(BigInt(1_100_000));
  });

  it("converts amounts with exactly 6 decimal places", () => {
    expect(amountToUsdcUnits(1.000001)).toBe(BigInt(1_000_001));
  });

  it("truncates beyond 6 decimal places (USDC precision)", () => {
    // 1.0000009 — 7th decimal is dropped
    expect(amountToUsdcUnits(1.0000009)).toBe(BigInt(1_000_000));
  });

  it("handles zero", () => {
    expect(amountToUsdcUnits(0)).toBe(BigInt(0));
  });

  it("handles large invoice amounts without precision loss", () => {
    // $50,000 is a realistic large invoice
    expect(amountToUsdcUnits(50000)).toBe(BigInt(50_000_000_000));
  });
});
