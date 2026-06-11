/**
 * Transak off-ramp `execute` regression tests
 *
 * Locks in the money-critical behavior of POST /api/transak/execute:
 *  1. Auth required
 *  2. Input validation (deposit address, partner_order_id)
 *  3. **Server-side amount binding** — the executed amount comes from the
 *     server-side session row created by create-widget-url, NEVER the request
 *     body. A tampered postMessage cannot execute a different amount. (This is
 *     the HIGH-risk gap that prompted this suite.)
 *  4. Session/idempotency: unknown session, foreign user, already-claimed order
 *  5. Insufficient balance
 *  6. Happy path: claim → debit (session amount) → USDC send → processing
 *  7. Send failure → withdrawal failed + reversal credit written
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Hoisted shared state the mocks read at call time.
const h = vi.hoisted(() => ({
  cfg: {} as {
    user: { id: string } | null;
    authError: unknown;
    sessionRow: { id: string; user_id: string; amount: number; status: string } | null;
    balance: number | null;
    merchantProfile: { privy_wallet_id: string | null; wallet_address: string } | null;
    claimRow: unknown;
    claimError: unknown;
    debitError: { code?: string; message: string } | null;
    sendHash: string;
    sendThrows: string | null;
  },
  calls: { ledgerInserts: [] as Array<Record<string, unknown>>, sends: [] as unknown[] },
}));

vi.mock("@/lib/supabaseAdmin", () => {
  function builder(table: string) {
    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.insert = (payload: Record<string, unknown>) => {
      if (table === "ledger_entries") h.calls.ledgerInserts.push(payload);
      return b;
    };
    b.update = () => b;
    b.delete = () => b;
    b.eq = () => b;
    b.maybeSingle = () => {
      if (table === "withdrawals") return Promise.resolve({ data: h.cfg.sessionRow, error: null });
      if (table === "balances")
        return Promise.resolve({ data: h.cfg.balance == null ? null : { amount: h.cfg.balance }, error: null });
      if (table === "merchant_profiles")
        return Promise.resolve({ data: h.cfg.merchantProfile, error: null });
      return Promise.resolve({ data: null, error: null });
    };
    // .update().eq().eq().select().single() — the atomic claim
    b.single = () => Promise.resolve({ data: h.cfg.claimRow, error: h.cfg.claimError });
    // Awaited directly (ledger insert, status updates, delete)
    b.then = (onF: (v: { error: unknown }) => unknown, onR?: (e: unknown) => unknown) => {
      const result = table === "ledger_entries" ? { error: h.cfg.debitError } : { error: null };
      return Promise.resolve(result).then(onF, onR);
    };
    return b;
  }
  return {
    supabaseAdmin: {
      auth: {
        getUser: async () => ({
          data: { user: h.cfg.authError ? null : h.cfg.user },
          error: h.cfg.authError,
        }),
      },
      from: (table: string) => builder(table),
    },
  };
});

vi.mock("@/lib/privy", () => ({
  getPrivyClient: () => ({
    walletApi: {
      ethereum: {
        sendTransaction: async (args: unknown) => {
          h.calls.sends.push(args);
          if (h.cfg.sendThrows) throw new Error(h.cfg.sendThrows);
          return { hash: h.cfg.sendHash };
        },
      },
    },
  }),
}));

const { POST } = await import("@/app/api/transak/execute/route");

const DEPOSIT = "0x1111111111111111111111111111111111111111";
const ORDER = "order-uuid-1";

function req(body: object, token: string | null = "valid-token"): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers["authorization"] = `Bearer ${token}`;
  return new Request("http://localhost/api/transak/execute", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54Bda02913";
  h.calls.ledgerInserts = [];
  h.calls.sends = [];
  h.cfg = {
    user: { id: "user-1" },
    authError: null,
    sessionRow: { id: "wd-1", user_id: "user-1", amount: 100, status: "session_created" },
    balance: 1000,
    merchantProfile: { privy_wallet_id: "pw-1", wallet_address: "0xMerchantWallet000000000000000000000000A" },
    claimRow: { id: "wd-1", user_id: "user-1", amount: 100, status: "pending" },
    claimError: null,
    debitError: null,
    sendHash: "0xsenttxhash",
    sendThrows: null,
  };
});

describe("POST /api/transak/execute", () => {
  describe("auth", () => {
    it("401 when no bearer token", async () => {
      const res = await POST(req({ deposit_address: DEPOSIT, partner_order_id: ORDER, amount: 100 }, null));
      expect(res.status).toBe(401);
    });
    it("401 when token is invalid", async () => {
      h.cfg.authError = { message: "bad token" };
      const res = await POST(req({ deposit_address: DEPOSIT, partner_order_id: ORDER, amount: 100 }));
      expect(res.status).toBe(401);
    });
  });

  describe("validation", () => {
    it("400 on invalid deposit address", async () => {
      const res = await POST(req({ deposit_address: "not-an-address", partner_order_id: ORDER, amount: 100 }));
      expect(res.status).toBe(400);
    });
    it("400 when partner_order_id missing", async () => {
      const res = await POST(req({ deposit_address: DEPOSIT, amount: 100 }));
      expect(res.status).toBe(400);
    });
  });

  describe("session binding (the fix)", () => {
    it("400 when no server-side session exists for the order", async () => {
      h.cfg.sessionRow = null;
      const res = await POST(req({ deposit_address: DEPOSIT, partner_order_id: ORDER, amount: 100 }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/session/i);
    });

    it("403 when the session belongs to another user", async () => {
      h.cfg.sessionRow = { id: "wd-1", user_id: "someone-else", amount: 100, status: "session_created" };
      const res = await POST(req({ deposit_address: DEPOSIT, partner_order_id: ORDER, amount: 100 }));
      expect(res.status).toBe(403);
    });

    it("REJECTS a body amount higher than the bound session amount", async () => {
      // session was created for $100; attacker tries to execute $50,000
      const res = await POST(req({ deposit_address: DEPOSIT, partner_order_id: ORDER, amount: 50_000 }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/match/i);
      expect(h.calls.sends.length).toBe(0); // no USDC sent
    });

    it("uses the SESSION amount even when the body omits it", async () => {
      const res = await POST(req({ deposit_address: DEPOSIT, partner_order_id: ORDER }));
      expect(res.status).toBe(200);
      const debit = h.calls.ledgerInserts.find((e) => e.type === "debit");
      expect(debit?.amount).toBe(100); // bound amount, not the body
    });

    it("rejects a negative body amount (mismatch tripwire)", async () => {
      const res = await POST(req({ deposit_address: DEPOSIT, partner_order_id: ORDER, amount: -5 }));
      expect(res.status).toBe(400);
      expect(h.calls.sends.length).toBe(0);
    });

    it("ignores a non-numeric body amount and uses the session amount", async () => {
      const res = await POST(req({ deposit_address: DEPOSIT, partner_order_id: ORDER, amount: "abc" }));
      expect(res.status).toBe(200);
      const debit = h.calls.ledgerInserts.find((e) => e.type === "debit");
      expect(debit?.amount).toBe(100);
    });
  });

  describe("idempotency / race", () => {
    it("409 when the session is already claimed (status not session_created)", async () => {
      h.cfg.sessionRow = { id: "wd-1", user_id: "user-1", amount: 100, status: "processing" };
      const res = await POST(req({ deposit_address: DEPOSIT, partner_order_id: ORDER, amount: 100 }));
      expect(res.status).toBe(409);
    });
    it("409 when the atomic claim loses the race (no row updated)", async () => {
      h.cfg.claimRow = null; // UPDATE ... WHERE status='session_created' matched nothing
      const res = await POST(req({ deposit_address: DEPOSIT, partner_order_id: ORDER, amount: 100 }));
      expect(res.status).toBe(409);
      expect(h.calls.sends.length).toBe(0);
    });
  });

  describe("balance", () => {
    it("400 when amount exceeds balance", async () => {
      h.cfg.balance = 10; // session amount is 100
      const res = await POST(req({ deposit_address: DEPOSIT, partner_order_id: ORDER, amount: 100 }));
      expect(res.status).toBe(400);
      expect(h.calls.sends.length).toBe(0);
    });
    it("400 (insufficient) when the debit hits the non-negative balance CHECK (23514)", async () => {
      h.cfg.debitError = { code: "23514", message: "balance check" };
      const res = await POST(req({ deposit_address: DEPOSIT, partner_order_id: ORDER, amount: 100 }));
      expect(res.status).toBe(400);
    });
  });

  describe("happy path", () => {
    it("debits the session amount, sends USDC, returns processing + tx_hash", async () => {
      const res = await POST(req({ deposit_address: DEPOSIT, partner_order_id: ORDER, amount: 100 }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("processing");
      expect(json.tx_hash).toBe("0xsenttxhash");
      const debit = h.calls.ledgerInserts.find((e) => e.type === "debit");
      expect(debit?.amount).toBe(100);
      expect(debit?.idempotency_key).toBe("withdrawal:wd-1:debit");
      expect(h.calls.sends.length).toBe(1);
    });
  });

  describe("send failure", () => {
    it("marks failed and writes a reversal credit when the USDC send throws", async () => {
      h.cfg.sendThrows = "privy boom";
      const res = await POST(req({ deposit_address: DEPOSIT, partner_order_id: ORDER, amount: 100 }));
      expect(res.status).toBe(500);
      const reversal = h.calls.ledgerInserts.find((e) => e.type === "credit");
      expect(reversal).toBeTruthy();
      expect(reversal?.amount).toBe(100);
      expect(reversal?.idempotency_key).toBe("withdrawal:wd-1:reversal");
    });
  });
});
