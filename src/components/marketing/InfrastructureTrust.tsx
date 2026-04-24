const cards = [
  {
    icon: "🏛",
    title: "Regulated partners only",
    desc: "Every financial service in PortPagos is provided by licensed and regulated entities. Bridge holds money transmission licences. USDC is issued by Circle, a regulated financial institution.",
  },
  {
    icon: "🔍",
    title: "KYC / KYB verified",
    desc: "All merchants are fully identity-verified before accepting payments. All customers are verified before sending. Compliant with EU AML directives.",
  },
  {
    icon: "💵",
    title: "1:1 USD backing",
    desc: "USDC is always redeemable 1:1 for US dollars. Circle holds equivalent reserves in cash and short-term US treasuries. Your balance is never exposed to speculative assets.",
  },
  {
    icon: "📋",
    title: "Immutable audit trail",
    desc: "Every payment is recorded on the Base network. Payment references are permanent, timestamped, and verifiable by your finance team or auditors at any time.",
  },
];

export default function InfrastructureTrust() {
  return (
    <section className="bg-slate-900 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
          Infrastructure
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Enterprise-grade infrastructure. Zero custody risk.
        </h2>
        <p className="mt-4 max-w-xl text-slate-400">
          PortPagos never holds your money. Every step of the payment flow is
          handled by licensed, regulated partners — we are the orchestration
          layer, not the bank.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-slate-800 bg-slate-950 p-8"
            >
              <span className="text-2xl">{c.icon}</span>
              <h3 className="mt-4 text-base font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
