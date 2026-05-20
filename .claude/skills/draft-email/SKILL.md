---
name: draft-email
description: Draft an outbound email from Guillermo (guillermo@portpagos.com) based on rough ideas. Use when the user says "draft an email to X", "write a reply to Y", "follow up with Z", "I need to email about", or when responding to an inbound email. Produces a ready-to-send subject line + plain text body that can be passed directly to scripts/send-email.js.
metadata:
  version: 1.0.0
---

# Draft Email

You are drafting an outbound email on behalf of Guillermo Rocha (guillermo@portpagos.com), founder of PortPagos.

---

## Step 1 — Load context (always, before writing a word)

Read these files in order:
1. `.claude/sources/glossary.md` — domain vocabulary, banned words, preferred framings
2. `.agents/product-marketing-context.md` — product, ICP, voice, value props
3. `.claude/knowledge/sales.md` — active pipeline, prior interactions with this contact

If the user mentions a company or person name, grep `.claude/knowledge/sales.md` for any prior notes on them before drafting.

---

## Step 2 — Classify the email type

| Type | Route to | When |
|---|---|---|
| Prospect outreach (cold) | `cold-email` skill | No prior relationship |
| Prospect follow-up | `sales` agent knowledge | Prior contact logged |
| Strategic partner (Bridge, Alchemy, investors) | `founder` agent judgment | Infrastructure or capital relationships |
| Pilot customer | `sales` agent knowledge | Active or prospective pilot |
| Announcement / campaign | `marketer` agent | One-to-many audience |
| Inbound reply | Match tone of inbound | Someone emailed Guillermo first |

For **inbound replies**: match the formality level of the inbound email. If they were informal, be informal. If they were formal, be formal.

---

## Step 3 — Draft the email

**Voice rules (always apply):**
- Write as Guillermo — first person singular ("I", not "we"), direct, no corporate filler
- Lead with their context or their email, not with PortPagos pitch
- One clear ask or next step per email — never more than one
- Short paragraphs (2–3 sentences max). No bullet lists in outbound emails
- No subject line clickbait. Subject should be plain and specific
- Never use banned words from the glossary
- Never claim a feature exists that isn't live — check `.claude/knowledge/product-manager.md` if unsure

**Format to produce:**

```
SUBJECT: [subject line]

---

[plain text body]

Best,
Guillermo
PortPagos
```

Plain text only — no markdown formatting in the body (the send script handles HTML conversion).

---

## Step 4 — Show the draft and the send command

After the draft, output the exact terminal command to send it:

```
To send this email, save the body to a file and run:

  node --env-file=.env.local scripts/send-email.js \
    --to "recipient@company.com" \
    --subject "Subject line here" \
    --body-file /tmp/email-draft.txt
```

Also offer to save the body directly to `/tmp/email-draft.txt` so the user can run the command immediately.

---

## Step 5 — Log the draft

Append a one-line entry to `.claude/knowledge/sales.md` under `## Log`:

```
### YYYY-MM-DD — Draft: [subject] → [recipient name / company]
- Context: [one sentence on what this email is about]
- Next action: [what Guillermo expects to happen after sending]
```

Do not log the email body or any PII beyond name and company.

---

## Quality checks before presenting the draft

- Subject line is under 60 characters
- Opening line references something specific to the recipient (not generic)
- Single call to action — one next step only
- No banned words (check glossary)
- No unverified product claims
- Tone matches the relationship (partner vs. cold prospect vs. pilot customer)
- Length: 100–200 words for outbound, up to 300 for complex replies
