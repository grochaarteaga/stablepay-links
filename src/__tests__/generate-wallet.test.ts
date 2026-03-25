/**
 * generate-wallet API route tests
 *
 * Covers:
 *  1. Unauthenticated requests are rejected
 *  2. Merchants cannot touch invoices they don't own
 *  3. Idempotency: existing wallet address is returned without re-generating
 *  4. Happy path: wallet is generated and stored
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockInvoiceMaybeSingle = vi.fn();
const mockProfileMaybeSingle = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === "merchant_profiles") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: mockProfileMaybeSingle }),
          }),
        };
      }
      // invoices table
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: mockInvoiceMaybeSingle }),
          }),
        }),
        update: () => ({
          eq: () => ({
            eq: () => mockUpdate(),
          }),
        }),
      };
    },
  },
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const INVOICE_ID = "invoice-uuid-abc";
const MERCHANT_USER_ID = "merchant-user-uuid";

function buildRequest(token?: string): Request {
  return new Request(
    `http://localhost/api/invoices/${INVOICE_ID}/generate-wallet`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
}

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

const { POST } = await import(
  "@/app/api/invoices/[invoiceId]/generate-wallet/route"
);

const context = { params: Promise.resolve({ invoiceId: INVOICE_ID }) };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/invoices/[invoiceId]/generate-wallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: MERCHANT_USER_ID } },
      error: null,
    });
    // Default invoice: no wallet assigned yet
    mockInvoiceMaybeSingle.mockResolvedValue({
      data: { id: INVOICE_ID, invoice_wallet_address: null },
      error: null,
    });
    // Default merchant profile: has a Privy wallet
    mockProfileMaybeSingle.mockResolvedValue({
      data: { wallet_address: "0xMerchantPrivyWallet" },
      error: null,
    });
    mockUpdate.mockResolvedValue({ error: null });
  });

  // -------------------------------------------------------------------------
  // 1. Authentication
  // -------------------------------------------------------------------------

  describe("authentication", () => {
    it("returns 401 when no Authorization header is present", async () => {
      const res = await POST(buildRequest(), context);
      expect(res.status).toBe(401);
    });

    it("returns 401 when token is invalid", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "invalid token" },
      });
      const res = await POST(buildRequest("bad-token"), context);
      expect(res.status).toBe(401);
    });

    it("returns 401 when user is null (expired session)", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
      const res = await POST(buildRequest("expired-token"), context);
      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Authorization (ownership)
  // -------------------------------------------------------------------------

  describe("authorization", () => {
    it("returns 404 when invoice belongs to a different merchant", async () => {
      mockInvoiceMaybeSingle.mockResolvedValue({ data: null, error: null });
      const res = await POST(buildRequest("valid-token"), context);
      expect(res.status).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Idempotency
  // -------------------------------------------------------------------------

  describe("idempotency", () => {
    it("returns the existing address without creating a new wallet", async () => {
      mockInvoiceMaybeSingle.mockResolvedValue({
        data: { id: INVOICE_ID, invoice_wallet_address: "0xExistingAddress" },
        error: null,
      });
      const res = await POST(buildRequest("valid-token"), context);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.address).toBe("0xExistingAddress");
      // No write should have happened
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Happy path
  // -------------------------------------------------------------------------

  describe("happy path", () => {
    it("assigns merchant Privy wallet to invoice and returns address", async () => {
      const res = await POST(buildRequest("valid-token"), context);
      const json = await res.json();
      expect(res.status).toBe(200);
      // Returns the merchant's Privy wallet, not a freshly generated wallet
      expect(json.address).toBe("0xMerchantPrivyWallet");
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe("missing merchant wallet", () => {
    it("returns 400 when merchant has not set up a Privy wallet yet", async () => {
      mockProfileMaybeSingle.mockResolvedValue({ data: null, error: null });
      const res = await POST(buildRequest("valid-token"), context);
      expect(res.status).toBe(400);
    });
  });
});
