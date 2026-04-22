import Link from "next/link";

const features = [
  {
    title: "One payment method, every port",
    desc: "Stop maintaining 40 different banking relationships. Send from one account to any port agent on PortPagos.",
  },
  {
    title: "No FX exposure",
    desc: "Payments are settled in USD-backed stablecoins. No conversion spread, no rate risk between payment and settlement.",
  },
  {
    title: "Real-time disbursement tracking",
    desc: "Know the moment a port agent receives funds. No more 'did the wire arrive?' calls.",
  },
  {
    title: "Built-in audit trail",
    desc: "Every disbursement is recorded on-chain. Finance teams get one-click reconciliation exports.",
  },
  {
    title: "No correspondent bank delays",
    desc: "Funds move directly — no intermediary banks adding days and fees to every transaction.",
  },
  {
    title: "Works with your existing workflow",
    desc: "No integration required. Click a payment link, approve the amount, done.",
  },
];

export default function ForShippingCompanies() {
  return (
    <section id="for-shipping-companies" className="border-b border-slate-800 bg-slate-950 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
            For shipping companies
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            One way to pay every port, everywhere.
          </h2>
          <p className="mt-4 text-slate-400">
            Managing port disbursements across dozens of countries means dozens
            of bank accounts, dozens of correspondent banks, and dozens of
            chances for a payment to go wrong. There&apos;s a better way.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <h3 className="text-sm font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-medium text-white transition hover:border-slate-600 hover:bg-slate-700"
          >
            Talk to our team →
          </Link>
        </div>
      </div>
    </section>
  );
}
