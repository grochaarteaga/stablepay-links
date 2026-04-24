import Link from "next/link";

const pains = [
  "Waiting 15 days for disbursement after vessel departure",
  "Advancing port costs from your own capital",
  "Chasing shipping companies for overdue invoices",
  "Losing 3–5% on every international wire",
];

const gains = [
  { label: "Same-day settlement", desc: "Get paid before the vessel leaves port." },
  { label: "Zero float risk", desc: "No more advancing costs. Funds arrive first." },
  { label: "Full payment audit trail", desc: "Every transaction logged with timestamp and payment reference." },
  { label: "One link, any client", desc: "Works for any shipping company, anywhere in the world." },
];

export default function ForPortAgents() {
  return (
    <section id="for-port-agents" className="bg-slate-900 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">

          {/* Left: copy */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
              For port agents
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Stop being your customer&apos;s bank.
            </h2>
            <p className="mt-4 text-slate-400">
              Port agents advance millions in port costs every year — and then
              wait weeks to get it back. PortPagos flips the model: get paid
              before the vessel clears, not after the wire arrives.
            </p>

            <div className="mt-8">
              <p className="text-xs font-medium uppercase tracking-widest text-slate-600 mb-4">
                Today you deal with
              </p>
              <ul className="space-y-2">
                {pains.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-slate-500">
                    <span className="mt-0.5 text-red-500 flex-shrink-0">✕</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/signup"
              className="mt-10 inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-500"
            >
              Start receiving payments →
            </Link>
          </div>

          {/* Right: gains */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {gains.map((g) => (
              <div
                key={g.label}
                className="rounded-xl border border-slate-800 bg-slate-950 p-6"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600/10 border border-green-600/20">
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-white">{g.label}</h3>
                <p className="mt-1 text-xs text-slate-500">{g.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
