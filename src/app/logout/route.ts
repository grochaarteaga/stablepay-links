import { NextResponse } from "next/server";

export async function POST() {
  // Supabase signOut MUST be done client-side in Next.js 16.
  // So here we simply redirect.
  return NextResponse.redirect("/login");
}
