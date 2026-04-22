import Link from "next/link";

const comparisons = [
  { label: "Setup fee", portpagos: "Free", bank: "$500–2,000" },
  { label: "Monthly fee", portpagos: "None", bank: "$50–300" },
  { label: "Per transaction", portpagos: "0.5%", bank: "3–5% + fixed fee" },
  { label: "Settlement time", portpagos: "< 2 minutes", bank: "3–15 business days" },
  { label: "Payment visibility", portpagos: "Real-time", bank: "None" },
  { label: "Reconciliation", portpagos: "Automatic", bank: "Manual" },
];

export default function PricingTeaser() {
  return (
    <section id="pricing" className="bg-slate-900 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">

          {/* Left: copy */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Pricing
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Priced for operations,<br />not for banks.
            </h2>
            <p className="mt-4 text-slate-400">
              One flat rate. No hidden fees. No minimum volumes.
              No monthly commitment. Pay only when you get paid.
            </p>

            <div className="mt-10 rounded-xl border border-green-600/20 bg-green-600/5 p-8">
              <p className="text-xs font-medium uppercase tracking-widest text-green-500">
                Simple pricing
              </p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-6xl font-bold tracking-tight text-white">0.5%</span>
                <span className="mb-2 text-slate-400">per settlement</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                That&apos;s it. No setup. No monthly fees. No surprises.
              </p>
              <Link
                href="/signup"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-500 w-full text-center"
              >
                Get started — free
              </Link>
            </div>
          </div>

          {/* Right: comparison table */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-6">
              PortPagos vs. international bank wire
            </p>
            <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 overflow-hidden">
              <div className="grid grid-cols-3 bg-slate-800 px-4 py-3">
                <span className="text-xs font-medium text-slate-400"></span>
                <span className="text-xs font-medium text-green-400 text-center">PortPagos</span>
                <span className="text-xs font-medium text-slate-500 text-center">Bank wire</span>
              </div>
              {comparisons.map((row) => (
                <div key={row.label} className="grid grid-cols-3 bg-slate-900 px-4 py-4 items-center">
                  <span className="text-xs text-slate-400">{row.label}</span>
                  <span className="text-sm font-medium text-green-400 text-center">{row.portpagos}</span>
                  <span className="text-sm text-slate-500 text-center">{row.bank}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
