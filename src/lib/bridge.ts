// Bridge API client for PortPagos
// Docs: https://apidocs.bridge.xyz

const BRIDGE_API_URL = process.env.BRIDGE_API_URL || "https://api.bridge.xyz";
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY!;

async function bridgeRequest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BRIDGE_API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Api-Key": BRIDGE_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Bridge API error ${res.status}: ${error}`);
  }

  return res.json();
}

export const bridge = {
  // Create a KYB customer on Bridge
  async createCustomer(data: {
    first_name?: string;
    last_name?: string;
    email: string;
    type?: "business" | "individual";
    company_name?: string;
  }) {
    return bridgeRequest("POST", "/v0/customers", data);
  },

  // Get an existing customer by ID
  async getCustomer(customerId: string) {
    return bridgeRequest("GET", `/v0/customers/${customerId}`);
  },

  // Create a virtual IBAN (external account) for a customer
  async createVirtualAccount(customerId: string) {
    return bridgeRequest("POST", `/v0/customers/${customerId}/external_accounts`, {
      currency: "eur",
      account_type: "iban",
    });
  },

  // List external accounts for a customer
  async listVirtualAccounts(customerId: string) {
    return bridgeRequest("GET", `/v0/customers/${customerId}/external_accounts`);
  },

  // Get a conversion quote (preview — does not lock a rate)
  async createQuote(data: {
    customer_id: string;
    source_currency: "eur";
    destination_currency: "usdc";
    source_amount: string;
  }) {
    return bridgeRequest("POST", "/v0/quotes", data);
  },

  // Execute a transfer (conversion + payout to wallet on Base)
  async executeTransfer(data: {
    customer_id: string;
    quote_id: string;
    destination_address: string;
    destination_chain: "base";
  }) {
    return bridgeRequest("POST", "/v0/transfers", data);
  },

  // Get transfer status
  async getTransfer(transferId: string) {
    return bridgeRequest("GET", `/v0/transfers/${transferId}`);
  },
};
