import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/invoices", "/onboarding"];
const AUTH_ONLY = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  // Create res once and mutate it — recreating it on every cookie write
  // discards previously written chunks, breaking chunked session cookies.
  const res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
          );
        },
      },
    }
  );

  // Use getUser() not getSession() — getSession() trusts cookie state without
  // validating the JWT server-side, masking stale-cookie bugs.
  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;

  if (!user && PROTECTED.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL("/login?reason=auth", req.url));
  }
  if (user && AUTH_ONLY.some((p) => path === p)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/invoices/:path*",
    "/onboarding/:path*",
    "/login",
    "/signup",
  ],
};
