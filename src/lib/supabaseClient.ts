import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

// Cookie options must be explicit so client and middleware write cookies
// with the same path/sameSite attributes — without this they can store
// two cookies with the same name but different paths, and only one is
// visible to middleware.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookieOptions: {
      path: "/",
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    },
  }
);
