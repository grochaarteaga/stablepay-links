import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PORTPAGOS_FEE_RATE = 0.006;

function getToken(req: Request): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

export async function GET(req: Request) {
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) {
    return NextResponse.json({ error: "Admin not configured." }, { status: 500 });
  }

  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user || user.id !== adminUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const startDate = url.searchParams.get("start");
  const endDate = url.searchParams.get("end");

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "start and end query params required." }, { status: 400 });
  }

  // Exempt merchant IDs (comma-separated env var)
  const exemptIds = new Set(
    (process.env.BILLING_EXEMPT_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );

  // Fetch all paid invoices in the date range
  const { data: invoices, error: invoiceError } = await supabaseAdmin
    .from("invoices")
    .select("id, amount, currency, customer, description, merchant_id, paid_at, created_at")
    .eq("status", "paid")
    .gte("paid_at", startDate)
    .lte("paid_at", endDate)
    .order("paid_at", { ascending: false });

  if (invoiceError) {
    console.error("Billing API: failed to fetch invoices:", invoiceError.message);
    return NextResponse.json({ error: "Failed to fetch billing data." }, { status: 500 });
  }

  if (!invoices || invoices.length === 0) {
    return NextResponse.json({ merchants: [], totals: { volume: 0, fee: 0, invoiceCount: 0 } });
  }

  // Get unique merchant IDs
  const merchantIds = [...new Set(invoices.map((inv) => inv.merchant_id))];

  // Fetch merchant profiles
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("user_id, company_name")
    .in("user_id", merchantIds);

  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p.company_name]) ?? []);
  const emailMap = new Map(
    authUsers?.users?.map((u) => [u.id, u.email ?? ""]) ?? []
  );

  // Group invoices by merchant
  const merchantMap = new Map<string, {
    merchantId: string;
    companyName: string;
    email: string;
    exempt: boolean;
    invoices: typeof invoices;
    volume: number;
    fee: number;
  }>();

  for (const inv of invoices) {
    const id = inv.merchant_id;
    if (!merchantMap.has(id)) {
      const exempt = exemptIds.has(id);
      merchantMap.set(id, {
        merchantId: id,
        companyName: profileMap.get(id) ?? "Unknown",
        email: emailMap.get(id) ?? "",
        exempt,
        invoices: [],
        volume: 0,
        fee: 0,
      });
    }
    const merchant = merchantMap.get(id)!;
    merchant.invoices.push(inv);
    merchant.volume += Number(inv.amount);
    merchant.fee += merchant.exempt ? 0 : Number(inv.amount) * PORTPAGOS_FEE_RATE;
  }

  const merchants = [...merchantMap.values()].sort((a, b) => b.volume - a.volume);

  const totals = merchants.reduce(
    (acc, m) => ({
      volume: acc.volume + m.volume,
      fee: acc.fee + m.fee,
      invoiceCount: acc.invoiceCount + m.invoices.length,
    }),
    { volume: 0, fee: 0, invoiceCount: 0 }
  );

  return NextResponse.json({ merchants, totals });
}
