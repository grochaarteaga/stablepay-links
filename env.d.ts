declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    // Wallet encryption (server-only)
    WALLET_ENCRYPTION_SECRET: string;

    // Alchemy webhook (server-only)
    ALCHEMY_WEBHOOK_SECRET: string;
    ALCHEMY_AUTH_TOKEN: string;
    ALCHEMY_WEBHOOK_ID: string;

    // Privy (server-only secret, public app ID)
    NEXT_PUBLIC_PRIVY_APP_ID: string;
    PRIVY_APP_SECRET: string;

    // Web3 / WalletConnect (public)
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: string;
    NEXT_PUBLIC_USDC_CONTRACT_ADDRESS: string;

    // Bridge (fiat-to-crypto partner, server-only)
    BRIDGE_API_KEY: string;
    BRIDGE_API_URL: string;
    BRIDGE_WEBHOOK_SECRET: string;
  }
}
