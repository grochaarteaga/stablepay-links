// Global env vars used across tests – matches .env.local values
process.env.WALLET_ENCRYPTION_SECRET = "test-encryption-secret-32chars!!";
process.env.ALCHEMY_WEBHOOK_SECRET = "super-long-random-string";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54Bda02913";
