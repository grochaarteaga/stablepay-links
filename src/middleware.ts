import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/invoices", "/onboarding"];
const AUTH_ONLY = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          req.cookies.set(name, value);
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
        },
        remove(name: string, options: Record<string, unknown>) {
          req.cookies.set(name, "");
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set(name, "", options as Parameters<typeof res.cookies.set>[2]);
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  if (!session && PROTECTED.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL("/login?reason=auth", req.url));
  }

  if (session && AUTH_ONLY.some((p) => path === p)) {
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
