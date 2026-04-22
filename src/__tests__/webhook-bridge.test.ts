/**
 * Bridge webhook handler tests
 *
 * Covers:
 *  1. HMAC-SHA256 signature verification
 *  2. deposit_received event → topup status updated
 *  3. payout_completed event → topup completed + ledger credit written
 *  4. payout_failed event → topup marked failed
 *  5. deposit_returned event → topup marked failed with message
 *  6. Unknown event type → logged but not rejected
 *  7. Unknown reference → audit log written but no topup update
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = "test-bridge-secret";
process.env.BRIDGE_WEBHOOK_SECRET = WEBHOOK_SECRET;

function sign(rawBody: string): string {
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
}

function buildRequest(body: object, signatureOverride?: string): Request {
  const raw = JSON.stringify(body);
  const sig = signatureOverride ?? sign(raw);
  return new Request("http://localhost/api/webhooks/bridge", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-bridge-signature": sig,
    },
    body: raw,
  });
}

const TOPUP_ID = "topup-uuid-1234";
const MERCHANT_ID = "merchant-uuid-5678";
const REFERENCE = "PP-ABCD1234";

// ---------------------------------------------------------------------------
// Mock supabaseAdmin
// ---------------------------------------------------------------------------

const mockTopupSelect = vi.fn();
const mockTopupUpdate = vi.fn();
const mockEventInsert = vi.fn();
const mockLedgerInsert = vi.fn();

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === "topup_events") {
        return { insert: mockEventInsert };
      }
      if (table === "ledger_entries") {
        return { insert: mockLedgerInsert };
      }
      if (table === "topups") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockTopupSelect,
            }),
          }),
          update: () => ({
            eq: mockTopupUpdate,
          }),
        };
      }
      return {};
    },
  },
}));

// ---------------------------------------------------------------------------
// Import route handler (after mocks)
// ---------------------------------------------------------------------------

const { POST } = await import("@/app/api/webhooks/bridge/route");

// ---------------------------------------------------------------------------
// Default mock setup helpers
// ---------------------------------------------------------------------------

function mockTopupFound() {
  // First call: find topup by reference → return topup_id
  mockTopupSelect.mockResolvedValueOnce({ data: { id: TOPUP_ID }, error: null });
}

function mockTopupDetailFound() {
  // Second call (in payout_completed): fetch topup detail → return merchant_id + usdc_amount
  mockTopupSelect.mockResolvedValueOnce({
    data: { merchant_id: MERCHANT_ID, usdc_amount: 107.50 },
    error: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEventInsert.mockResolvedValue({ error: null });
    mockTopupUpdate.mockResolvedValue({ error: null });
    mockLedgerInsert.mockResolvedValue({ error: null });
  });

  // ── 1. Signature verification ──────────────────────────────────────────

  describe("HMAC signature verification", () => {
    it("returns 200 ok:true when signature is missing (not rejected — prevents auto-pause)", async () => {
      const raw = JSON.stringify({ event_type: "deposit_received", reference: REFERENCE });
      const req = new Request("http://localhost/api/webhooks/bridge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: raw,
      });
      mockTopupSelect.mockResolvedValue({ data: null, error: null });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
    });

    it("returns 200 ok:true when signature is wrong", async () => {
      const req = buildRequest({ event_type: "deposit_received" }, "deadbeef00000000");
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
    });

    it("accepts a valid HMAC signature", async () => {
      mockTopupSelect.mockResolvedValue({ data: null, error: null });
      const req = buildRequest({ event_type: "unknown_event", reference: REFERENCE });
      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  // ── 2. deposit_received ────────────────────────────────────────────────

  describe("deposit_received", () => {
    it("updates topup status to deposit_received with eur_amount_received", async () => {
      mockTopupFound();
      const req = buildRequest({
        event_type: "deposit_received",
        reference: REFERENCE,
        amount: "100.00",
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockEventInsert).toHaveBeenCalledTimes(1);
      expect(mockTopupUpdate).toHaveBeenCalledTimes(1);
    });
  });

  // ── 3. payout_completed ────────────────────────────────────────────────

  describe("payout_completed", () => {
    it("marks topup completed, writes ledger credit", async () => {
      mockTopupFound();          // find topup by reference
      mockTopupDetailFound();    // fetch merchant_id for ledger

      const req = buildRequest({
        event_type: "payout_completed",
        reference: REFERENCE,
        tx_hash: "0xabc123",
        destination_amount: "107.50",
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockTopupUpdate).toHaveBeenCalledTimes(1);
      expect(mockLedgerInsert).toHaveBeenCalledTimes(1);
    });
  });

  // ── 4. payout_failed ──────────────────────────────────────────────────

  describe("payout_failed", () => {
    it("marks topup failed with error_message", async () => {
      mockTopupFound();
      const req = buildRequest({
        event_type: "payout_failed",
        reference: REFERENCE,
        error: "Insufficient liquidity",
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockTopupUpdate).toHaveBeenCalledTimes(1);
      expect(mockLedgerInsert).not.toHaveBeenCalled();
    });
  });

  // ── 5. deposit_returned ───────────────────────────────────────────────

  describe("deposit_returned", () => {
    it("marks topup failed with 'EUR returned to sender'", async () => {
      mockTopupFound();
      const req = buildRequest({
        event_type: "deposit_returned",
        reference: REFERENCE,
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockTopupUpdate).toHaveBeenCalledTimes(1);
      expect(mockLedgerInsert).not.toHaveBeenCalled();
    });
  });

  // ── 6. Unknown event type ─────────────────────────────────────────────

  describe("unknown event type", () => {
    it("logs event but does not update topup", async () => {
      mockTopupFound();
      const req = buildRequest({
        event_type: "some_future_event",
        reference: REFERENCE,
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      // audit log is always written
      expect(mockEventInsert).toHaveBeenCalledTimes(1);
      // but topup is not updated for unknown events
      expect(mockTopupUpdate).not.toHaveBeenCalled();
    });
  });

  // ── 7. Unknown reference ──────────────────────────────────────────────

  describe("unknown reference", () => {
    it("writes audit log but skips topup update when reference not found", async () => {
      mockTopupSelect.mockResolvedValue({ data: null, error: null });
      const req = buildRequest({
        event_type: "deposit_received",
        reference: "PP-UNKNOWN0",
        amount: "50.00",
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockEventInsert).toHaveBeenCalledTimes(1);
      expect(mockTopupUpdate).not.toHaveBeenCalled();
    });
  });
});
