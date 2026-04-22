import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const RECIPIENTS = ["guillermo@portpagos.com", "mauricio@portpagos.com"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { firstName, lastName, email, website, entityType, monthlyVolume, useCase } = body;

  if (!firstName || !lastName || !email || !website || !entityType || !monthlyVolume || !useCase) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#16a34a">New demo request — PortPagos</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#6b7280;width:180px">Name</td><td style="padding:8px 0;font-weight:600">${firstName} ${lastName}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Company website</td><td style="padding:8px 0">${website}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Entity type</td><td style="padding:8px 0">${entityType}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Monthly volume</td><td style="padding:8px 0">${monthlyVolume}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Use case</td><td style="padding:8px 0;white-space:pre-wrap">${useCase}</td></tr>
      </table>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: "PortPagos <guillermo@portpagos.com>",
    to: RECIPIENTS,
    subject: `Demo request from ${firstName} ${lastName} — ${website}`,
    html,
  });

  if (error) {
    console.error("Resend error:", JSON.stringify(error));
    return NextResponse.json({ error: "Failed to send email.", detail: error }, { status: 500 });
  }

  console.log("Resend success:", data);

  return NextResponse.json({ ok: true });
}
