/**
 * Webhook handler tests
 *
 * Covers:
 *  1. HMAC signature verification
 *  2. All known Alchemy payload shapes (the source of past missed webhooks)
 *  3. Amount precision (BigInt comparison)
 *  4. Idempotency (already-paid invoices are not double-updated)
 *  5. Under-payment is ignored
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = process.env.ALCHEMY_WEBHOOK_SECRET!;

/** Build a valid HMAC-SHA256 signature for a raw body string */
function sign(rawBody: string): string {
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
}

/** Minimal ERC-20 Transfer log for USDC with 6 decimals */
function makeTransferLog(toAddress: string, amountUsdc: number) {
  // topics[2] is the "to" address padded to 32 bytes
  const paddedTo = "0x000000000000000000000000" + toAddress.slice(2).toLowerCase();
  // amount in USDC units as uint256 hex (6 decimals)
  const amountUnits = BigInt(Math.round(amountUsdc * 1_000_000));
  const dataHex = "0x" + amountUnits.toString(16).padStart(64, "0");

  return {
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000001234567890123456789012345678901234567890", // from
      paddedTo,
    ],
    data: dataHex,
    transaction: { hash: "0xdeadbeef" },
  };
}

const WALLET_ADDRESS = "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12";
const INVOICE_ID = "invoice-uuid-1234";

// ---------------------------------------------------------------------------
// Mock supabaseAdmin
// ---------------------------------------------------------------------------

// mockOrder is the terminal call for the new invoice query:
// .from("invoices").select().eq("invoice_wallet_address").eq("status").order()
const mockOrder = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: mockOrder,
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          eq: () => mockUpdate(),
        }),
      }),
    }),
  },
}));

// ---------------------------------------------------------------------------
// Build a real Next.js-compatible Request
// ---------------------------------------------------------------------------

function buildRequest(body: object, signatureOverride?: string): Request {
  const raw = JSON.stringify(body);
  const sig = signatureOverride ?? sign(raw);
  return new Request("http://localhost/api/webhooks/alchemy", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-alchemy-signature": sig,
    },
    body: raw,
  });
}

// ---------------------------------------------------------------------------
// Import route handler (after mocks are in place)
// ---------------------------------------------------------------------------

const { POST } = await import("@/app/api/webhooks/alchemy/route");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/alchemy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: one pending invoice for 100 USDC pointing to the merchant wallet
    mockOrder.mockResolvedValue({
      data: [{ id: INVOICE_ID, amount: 100, tx_hash: null }],
      error: null,
    });
    mockUpdate.mockResolvedValue({ error: null });
  });

  // -------------------------------------------------------------------------
  // 1. Authentication
  // -------------------------------------------------------------------------

  describe("HMAC signature verification", () => {
    it("returns 200 with invalid_signature when signature header is missing", async () => {
      const raw = JSON.stringify({ block: { logs: [] } });
      const req = new Request("http://localhost/api/webhooks/alchemy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: raw,
      });
      const res = await POST(req);
      // Returns 200 (not 401) so Alchemy doesn't auto-pause the webhook
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.reason).toBe("invalid_signature");
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("returns 200 with invalid_signature when signature is wrong", async () => {
      const req = buildRequest({ block: { logs: [] } }, "deadbeef00000000");
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.reason).toBe("invalid_signature");
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("accepts a valid HMAC signature", async () => {
      const req = buildRequest({ block: { logs: [] } });
      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Payload shapes (Alchemy varies this by webhook type)
  // This is the most common source of missed payments.
  // -------------------------------------------------------------------------

  describe("Alchemy payload shapes", () => {
    const log = makeTransferLog(WALLET_ADDRESS, 100);

    const shapes = [
      {
        name: "event.activity (Address Activity webhook — recommended)",
        body: {
          event: {
            activity: [
              {
                category: "token",
                asset: "USDC",
                hash: "0xdeadbeef",
                log: {
                  // address must match NEXT_PUBLIC_USDC_CONTRACT_ADDRESS
                  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54Bda02913",
                  ...makeTransferLog(WALLET_ADDRESS, 100),
                },
              },
            ],
          },
        },
      },
      {
        name: "event.data.block.logs (GraphQL webhook)",
        body: { event: { data: { block: { logs: [log] } } } },
      },
      {
        name: "data.block.logs (Activity webhook v2)",
        body: { data: { block: { logs: [log] } } },
      },
      {
        name: "payload.data.block.logs (Custom webhook wrapper)",
        body: { payload: { data: { block: { logs: [log] } } } },
      },
      {
        name: "block.logs (direct block shape)",
        body: { block: { logs: [log] } },
      },
    ];

    shapes.forEach(({ name, body }) => {
      it(`marks invoice paid for shape: ${name}`, async () => {
        const req = buildRequest(body);
        const res = await POST(req);
        expect(res.status).toBe(200);
        // The update mock should have been called once (invoice marked paid)
        expect(mockUpdate).toHaveBeenCalledTimes(1);
      });
    });

    it("returns ok:true with no DB calls when no logs found", async () => {
      const req = buildRequest({ completely: "unknown shape" });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.reason).toBe("no_logs");
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Amount precision
  // -------------------------------------------------------------------------

  describe("amount comparison", () => {
    it("marks paid when transfer exactly matches invoice amount", async () => {
      const req = buildRequest({ block: { logs: [makeTransferLog(WALLET_ADDRESS, 100)] } });
      await POST(req);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    it("marks paid when transfer exceeds invoice amount (overpayment)", async () => {
      const req = buildRequest({ block: { logs: [makeTransferLog(WALLET_ADDRESS, 150)] } });
      await POST(req);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    it("does NOT mark paid when transfer is less than invoice amount", async () => {
      const req = buildRequest({ block: { logs: [makeTransferLog(WALLET_ADDRESS, 99.99)] } });
      await POST(req);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("handles fractional USDC amounts correctly (no float precision loss)", async () => {
      mockOrder.mockResolvedValue({
        data: [{ id: INVOICE_ID, amount: 1.000001, tx_hash: null }],
        error: null,
      });
      const req = buildRequest({ block: { logs: [makeTransferLog(WALLET_ADDRESS, 1.000001)] } });
      await POST(req);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Idempotency — no pending invoices means nothing to update
  // -------------------------------------------------------------------------

  describe("idempotency", () => {
    it("does not update when there are no pending invoices (already paid)", async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });
      const req = buildRequest({ block: { logs: [makeTransferLog(WALLET_ADDRESS, 100)] } });
      await POST(req);
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Unknown wallet address
  // -------------------------------------------------------------------------

  it("does nothing when transfer targets an address with no invoice", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    const req = buildRequest({ block: { logs: [makeTransferLog(WALLET_ADDRESS, 100)] } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
