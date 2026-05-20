#!/usr/bin/env node
/**
 * Send an outbound email from guillermo@portpagos.com via Resend.
 *
 * Usage:
 *   node --env-file=.env.local scripts/send-email.js \
 *     --to "name@company.com" \
 *     --subject "Subject line" \
 *     --body-file /tmp/email-draft.txt
 *
 *   Or with inline body (for short emails):
 *     --body "Plain text body here"
 *
 * The script always shows a full preview and requires typing CONFIRM before sending.
 */

import { Resend } from "resend";
import { createInterface } from "readline";
import { readFileSync } from "fs";

// ── Parse args ────────────────────────────────────────────────────────────────

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : null;
}

const to = arg("--to");
const subject = arg("--subject");
const bodyFile = arg("--body-file");
const bodyInline = arg("--body");

if (!to || !subject || (!bodyFile && !bodyInline)) {
  console.error(`
Usage:
  node --env-file=.env.local scripts/send-email.js \\
    --to "recipient@company.com" \\
    --subject "Your subject" \\
    --body-file /tmp/draft.txt

  Or:  --body "Inline body text"
`);
  process.exit(1);
}

const body = bodyFile ? readFileSync(bodyFile, "utf8").trim() : bodyInline.trim();

if (!process.env.RESEND_API_KEY) {
  console.error("Error: RESEND_API_KEY not found. Run with --env-file=.env.local");
  process.exit(1);
}

// ── Convert plain text to minimal HTML ───────────────────────────────────────

function toHtml(text) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;color:#1e293b;font-size:15px;line-height:1.6">${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:40px 24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;padding:40px">
    ${paragraphs}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
    <p style="margin:0;color:#64748b;font-size:13px">Sent from guillermo@portpagos.com</p>
  </div>
</body>
</html>`;
}

// ── Preview ───────────────────────────────────────────────────────────────────

console.log("\n" + "─".repeat(60));
console.log("  EMAIL PREVIEW");
console.log("─".repeat(60));
console.log(`  From:    Guillermo at PortPagos <guillermo@portpagos.com>`);
console.log(`  To:      ${to}`);
console.log(`  Subject: ${subject}`);
console.log("─".repeat(60));
console.log(body);
console.log("─".repeat(60) + "\n");

// ── Confirmation ──────────────────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.question('Type CONFIRM to send, or anything else to abort: ', async (answer) => {
  rl.close();

  if (answer.trim() !== "CONFIRM") {
    console.log("Aborted. Email not sent.");
    process.exit(0);
  }

  // ── Send ────────────────────────────────────────────────────────────────────

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: "Guillermo at PortPagos <guillermo@portpagos.com>",
      to,
      subject,
      text: body,
      html: toHtml(body),
    });

    if (error) {
      console.error("Send failed:", JSON.stringify(error, null, 2));
      process.exit(1);
    }

    console.log(`\nSent. Resend ID: ${data.id}`);
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Time:    ${new Date().toISOString()}\n`);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
});
