const partners = [
  { name: "Bridge", desc: "Fiat rails" },
  { name: "Base", desc: "Settlement layer" },
  { name: "Coinbase", desc: "Custody" },
  { name: "Circle", desc: "USDC issuer" },
  { name: "Privy", desc: "Wallet security" },
  { name: "Alchemy", desc: "Chain monitoring" },
];

export default function LogoStrip() {
  return (
    <section className="border-b border-slate-800 bg-slate-950 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-slate-500">
          Built on enterprise-grade rails
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {partners.map((p) => (
            <div key={p.name} className="flex flex-col items-center gap-1">
              <span className="text-lg font-semibold tracking-tight text-slate-300">
                {p.name}
              </span>
              <span className="text-xs text-slate-600">{p.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
