import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function getToken(req: Request): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ topupId: string }> }
) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topupId } = await params;

  const { data: topup, error } = await supabaseAdmin
    .from("topups")
    .select("*")
    .eq("id", topupId)
    .eq("merchant_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch topup:", error.message);
    return NextResponse.json({ error: "Failed to fetch top-up." }, { status: 500 });
  }

  if (!topup) {
    return NextResponse.json({ error: "Top-up not found." }, { status: 404 });
  }

  return NextResponse.json(topup);
}
