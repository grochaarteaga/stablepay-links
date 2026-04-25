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

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("company_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const companyName = profile?.company_name?.trim() ?? "";

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://portpagos.com";
  const ctaUrl = `${siteUrl}/invoices/new`;

  const headingName = companyName ? escapeHtml(companyName) : "";
  const greeting = headingName ? `Welcome, ${headingName}` : "Welcome to PortPagos";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 16px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

          <tr>
            <td style="padding:40px 40px 8px">
              <p style="margin:0 0 4px;color:#16a34a;font-size:14px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">PortPagos</p>
              <h1 style="margin:0 0 12px;color:#111827;font-size:26px;font-weight:700;line-height:1.2">${greeting}</h1>
              <p style="margin:0;color:#4b5563;font-size:16px;line-height:1.6">Your account is ready. Start receiving payments in USDC &mdash; no SWIFT wires, no waiting weeks.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px 8px">

              <table width="100%" cellpadding="0" cellspacing="0">

                <tr>
                  <td style="vertical-align:top;padding-bottom:24px">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:16px">
                          <div style="width:28px;height:28px;background-color:#16a34a;border-radius:50%;text-align:center;line-height:28px;color:#ffffff;font-size:13px;font-weight:700;flex-shrink:0">1</div>
                        </td>
                        <td>
                          <p style="margin:0 0 4px;color:#111827;font-size:15px;font-weight:600">Create your first invoice</p>
                          <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.5">Set the amount, add a reference, and get a payment link in seconds.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="vertical-align:top;padding-bottom:24px">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:16px">
                          <div style="width:28px;height:28px;background-color:#16a34a;border-radius:50%;text-align:center;line-height:28px;color:#ffffff;font-size:13px;font-weight:700;flex-shrink:0">2</div>
                        </td>
                        <td>
                          <p style="margin:0 0 4px;color:#111827;font-size:15px;font-weight:600">Share the payment link</p>
                          <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.5">Send it by email, WhatsApp, or any channel &mdash; your customer pays in USDC.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="vertical-align:top;padding-bottom:32px">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:16px">
                          <div style="width:28px;height:28px;background-color:#16a34a;border-radius:50%;text-align:center;line-height:28px;color:#ffffff;font-size:13px;font-weight:700;flex-shrink:0">3</div>
                        </td>
                        <td>
                          <p style="margin:0 0 4px;color:#111827;font-size:15px;font-weight:600">Receive USDC on Base</p>
                          <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.5">Funds arrive in minutes. Withdraw anytime to your wallet.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 32px;border-radius:6px">Create your first invoice &#x2192;</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="padding:0 40px 32px">
              <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.6">Questions? Just reply to this email.</p>
              <p style="margin:12px 0 0;color:#4b5563;font-size:15px">Guillermo<br><span style="color:#9ca3af">PortPagos</span></p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 40px 24px;border-top:1px solid #f3f4f6;text-align:center">
              <p style="margin:0;color:#d1d5db;font-size:12px">Powered by <strong style="color:#9ca3af">PortPagos</strong> &mdash; USDC settlement for trade finance</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { error: sendError } = await resend.emails.send({
      from: "Guillermo at PortPagos <guillermo@portpagos.com>",
      to: user.email,
      subject: "Welcome to PortPagos — you're all set",
      html,
    });

    if (sendError) {
      console.error("Resend error (welcome-email):", JSON.stringify(sendError));
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Resend exception (welcome-email):", message);
  }

  return NextResponse.json({ ok: true });
}
