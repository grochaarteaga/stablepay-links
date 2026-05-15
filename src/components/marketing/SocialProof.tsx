const metrics = [
  { value: "< 2 min", label: "Average settlement time" },
  { value: "$0", label: "Setup cost" },
  { value: "100%", label: "Payment visibility" },
  { value: "24/7", label: "Settlement availability" },
];

export default function SocialProof() {
  return (
    <section className="border-b border-slate-800 bg-slate-950 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
            Results
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Built for teams that can&apos;t afford a payment to go wrong.
          </h2>
          <p className="mt-4 text-slate-400">
            Port agents and shipping companies use PortPagos to replace the
            bank wire — not because it&apos;s new technology, but because it
            actually works.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-px bg-slate-800 md:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="bg-slate-950 px-8 py-10 text-center">
              <p className="text-4xl font-bold tracking-tight text-green-400">
                {m.value}
              </p>
              <p className="mt-2 text-sm text-slate-400">{m.label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
