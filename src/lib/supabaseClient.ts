// src/lib/supabaseClient.ts
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

// Uses cookie-based session storage so the middleware can read the session
// server-side. Plain createClient uses localStorage which the middleware
// cannot access, causing redirect loops after login.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
