import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(
  req: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await context.params;

  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { customer_email } =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  if (
    typeof customer_email !== "string" ||
    !customer_email.trim() ||
    !isValidEmail(customer_email.trim())
  ) {
    return NextResponse.json(
      { error: "A valid customer_email is required" },
      { status: 400 }
    );
  }

  const recipientEmail = customer_email.trim().toLowerCase();

  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from("invoices")
    .select("id, amount, currency, customer, description, status, merchant_id")
    .eq("id", invoiceId)
    .eq("merchant_id", user.id)
    .maybeSingle();

  if (invoiceError) {
    console.error("Error fetching invoice:", invoiceError.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "paid" || invoice.status === "cancelled") {
    return NextResponse.json(
      { error: `Invoice is ${invoice.status} and cannot be sent` },
      { status: 409 }
    );
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("company_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const merchantName = escapeHtml(
    profile?.company_name?.trim() || user.email || "Your merchant"
  );

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://portpagos.com";
  const paymentUrl = `${siteUrl}/pay/${invoiceId}`;

  const rawAmount =
    typeof invoice.amount === "number" ? invoice.amount : Number(invoice.amount);
  const formattedAmount =
    "$" +
    rawAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) +
    " USDC";

  const reference = `#${invoiceId.slice(0, 8).toUpperCase()}`;
  const customerName = invoice.customer
    ? escapeHtml(String(invoice.customer).trim())
    : "";
  const description = invoice.description
    ? escapeHtml(String(invoice.description).trim())
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 16px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

          <tr>
            <td style="background-color:#16a34a;padding:32px 40px;text-align:center">
              <p style="margin:0;color:#dcfce7;font-size:14px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase">Payment request</p>
              <p style="margin:8px 0 0;color:#ffffff;font-size:36px;font-weight:700;letter-spacing:-0.02em">${escapeHtml(formattedAmount)}</p>
              ${customerName ? `<p style="margin:8px 0 0;color:#bbf7d0;font-size:15px">${customerName}</p>` : ""}
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px">
              <p style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:600">${merchantName} is requesting payment</p>
              ${description ? `<p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.5">${description}</p>` : `<p style="margin:0 0 24px"></p>`}

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border-collapse:collapse">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;width:140px">Amount</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;font-weight:600">${escapeHtml(formattedAmount)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Network</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;font-weight:600">Base</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#6b7280;font-size:14px">Reference</td>
                  <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;font-family:monospace">${escapeHtml(reference)}</td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${paymentUrl}" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 32px;border-radius:6px">Pay now &#x2192;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f3f4f6;background-color:#f9fafb">
              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5">You&#39;ll need a crypto wallet (MetaMask or WalletConnect) with USDC on Base to complete this payment.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 40px 24px;text-align:center">
              <p style="margin:0;color:#d1d5db;font-size:12px">Powered by <strong style="color:#9ca3af">PortPagos</strong> &mdash; USDC settlement for trade finance</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error: sendError } = await resend.emails.send({
    from: "PortPagos <payments@portpagos.com>",
    to: recipientEmail,
    replyTo: user.email,
    subject: `Payment request from ${profile?.company_name?.trim() || user.email} — ${formattedAmount}`,
    html,
  });

  if (sendError) {
    console.error("Resend error (send-email):", JSON.stringify(sendError));
    return NextResponse.json(
      { error: "Failed to send email", detail: sendError },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
