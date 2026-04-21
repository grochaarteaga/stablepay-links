import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
          Modern payment rails for maritime
        </p>

        <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-7xl">
          Port payments,{" "}
          <span className="text-green-400">settled in minutes.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-300 md:text-xl">
          PortPagos is the instant settlement network for port agents and
          shipping companies. Replace SWIFT wires and three-week payment cycles
          with a single link.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-500"
          >
            Get started — free
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-medium text-white transition hover:border-slate-600 hover:bg-slate-700"
          >
            Book a demo
          </Link>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Running on stablecoin rails. KYC-compliant. Live in Europe and LATAM.
        </p>
      </div>
    </section>
  );
}
