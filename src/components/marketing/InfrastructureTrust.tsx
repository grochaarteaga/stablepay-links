const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const BadgeCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const DollarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const FileTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const cards = [
  {
    Icon: ShieldIcon,
    title: "Regulated partners only",
    desc: "Every financial service in PortPagos is provided by licensed and regulated entities. Transak holds EU and FCA licences for fiat conversion. USDC is issued by Circle, a regulated financial institution.",
  },
  {
    Icon: BadgeCheckIcon,
    title: "KYC / KYB verified",
    desc: "All merchants are fully identity-verified before accepting payments. All customers are verified before sending. Compliant with EU AML directives.",
  },
  {
    Icon: DollarIcon,
    title: "1:1 USD backing",
    desc: "USDC is always redeemable 1:1 for US dollars. Circle holds equivalent reserves in cash and short-term US treasuries. Your balance is never exposed to speculative assets.",
  },
  {
    Icon: FileTextIcon,
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/10 border border-green-600/20 text-green-400">
                <c.Icon />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
