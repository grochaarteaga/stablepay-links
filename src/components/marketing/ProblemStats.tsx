const stats = [
  {
    value: "3–15",
    unit: "days",
    label: "Average SWIFT settlement time",
    contrast: "PortPagos: under 2 minutes",
  },
  {
    value: "$45",
    unit: "per wire",
    label: "Average international transfer fee",
    contrast: "PortPagos: 0.5% flat, no hidden fees",
  },
  {
    value: "0%",
    unit: "visibility",
    label: "Real-time tracking on bank wires",
    contrast: "PortPagos: every payment logged instantly",
  },
];

export default function ProblemStats() {
  return (
    <section className="bg-slate-900 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
          The problem
        </p>
        <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
          The maritime industry still moves money like it&apos;s 1995.
        </h2>
        <p className="mt-4 max-w-2xl text-slate-400">
          Port agents wait weeks to receive disbursements. Shipping companies
          juggle dozens of bank accounts across ports. Everyone pays the bank
          twice — once to send, once to receive.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-px bg-slate-800 md:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-slate-900 px-8 py-10"
            >
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold tracking-tight text-red-400">
                  {s.value}
                </span>
                <span className="mb-1 text-lg text-slate-500">{s.unit}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{s.label}</p>
              <p className="mt-4 text-xs font-medium text-green-400">
                → {s.contrast}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
