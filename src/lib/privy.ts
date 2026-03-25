import { PrivyClient } from "@privy-io/server-auth";

let _client: PrivyClient | null = null;

export function getPrivyClient(): PrivyClient {
  if (!_client) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error("NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET must be set");
    }

    _client = new PrivyClient(appId, appSecret);
  }
  return _client;
}
