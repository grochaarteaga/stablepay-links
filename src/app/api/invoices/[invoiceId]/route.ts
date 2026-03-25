// src/app/api/invoices/[invoiceId]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  _req: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await context.params;

  if (!invoiceId) {
    return NextResponse.json(
      { error: "Missing invoice ID" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select(
      "id, amount, currency, customer, description, status, invoice_wallet_address, created_at"
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching invoice:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ invoice: data });
}
