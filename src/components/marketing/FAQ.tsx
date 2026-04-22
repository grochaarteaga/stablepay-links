"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Is this crypto?",
    a: "No. PortPagos is a payment platform built for shipping operations. Under the hood, settlement runs on regulated, USD-backed stablecoin rails operated by licensed financial partners. You send and receive in dollars.",
  },
  {
    q: "What currency does my customer pay in?",
    a: "Customers pay in USDC — a digital dollar backed 1:1 by US dollar reserves held by Circle. From your customer's perspective it is exactly equivalent to paying in USD. There is no exchange rate risk and no conversion spread.",
  },
  {
    q: "How long does setup take?",
    a: "Most port agents are live in under an hour. Onboarding requires standard business verification documents — no integration work, no IT setup.",
  },
  {
    q: "How fast does the money actually arrive?",
    a: "Settlements complete in under 2 minutes from the moment your customer confirms payment. There are no correspondent banks, no cut-off times, and no business day restrictions. Payments process 24/7, including weekends and holidays.",
  },
  {
    q: "How do I receive money in my local currency?",
    a: "Funds can be paid out to your local bank account in supported currencies through our regulated payout partners. Conversion happens at transparent, mid-market rates.",
  },
  {
    q: "Who holds the funds during settlement?",
    a: "Funds are held by our regulated settlement partners in fully-reserved, USD-backed accounts. PortPagos never custodies customer funds directly.",
  },
  {
    q: "Is PortPagos legal in my country?",
    a: "PortPagos operates through KYC- and KYB-verified, licensed payment partners. We currently support port agents and shipping companies across Europe and LATAM, with new corridors added regularly.",
  },
  {
    q: "Do I need technical knowledge or a developer?",
    a: "No. Creating an invoice and receiving payment requires nothing more than a browser. You enter an amount, copy a link, and send it to your customer. No integration, no API, no wallet setup required on your end.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="border-b border-slate-800 bg-slate-950 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">

          {/* Left: heading */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
              FAQ
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Common questions
            </h2>
            <p className="mt-4 text-slate-400 text-sm">
              Still have questions? Write to us at{" "}
              <a
                href="mailto:guillermo@portpagos.com"
                className="text-green-400 hover:text-green-300 transition"
              >
                guillermo@portpagos.com
              </a>
            </p>
          </div>

          {/* Right: accordion */}
          <div className="lg:col-span-2 divide-y divide-slate-800">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-start justify-between gap-6 py-5 text-left"
                >
                  <span className="text-sm font-medium text-white">{faq.q}</span>
                  <span className="mt-0.5 flex-shrink-0 text-slate-500 text-sm">
                    {open === i ? "−" : "+"}
                  </span>
                </button>
                {open === i && (
                  <p className="pb-5 text-sm text-slate-400 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
