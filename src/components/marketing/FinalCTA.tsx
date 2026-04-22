import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="bg-slate-900 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 px-8 py-16 text-center md:px-16 md:py-24">

          {/* Subtle radial glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 50%, #16a34a, transparent)",
            }}
          />

          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Get started today
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Get paid faster.<br />Starting today.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
              Join port agents and shipping companies replacing SWIFT wires
              with instant settlement. Free to start. No contract required.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-green-600 px-8 py-3.5 text-sm font-medium text-white transition hover:bg-green-500"
              >
                Create a free account →
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-8 py-3.5 text-sm font-medium text-white transition hover:border-slate-600 hover:bg-slate-700"
              >
                Book a demo
              </Link>
            </div>

            <p className="mt-6 text-xs text-slate-600">
              No credit card required · No setup fees · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
