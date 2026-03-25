// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="max-w-xl w-full px-6 py-8 rounded-2xl border border-slate-800 bg-slate-900">
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">
          Stablecoin B2B Payment Links MVP
        </h1>
        <p className="text-sm md:text-base text-slate-300 mb-4">
          Chunk 1 is alive 🎉
        </p>
        <p className="text-sm text-slate-400 mb-6">
          Next.js + TypeScript + Tailwind + Supabase client have been set up.
          In the next chunks, we&apos;ll add authentication, invoice creation,
          per-invoice wallets on Base, and Alchemy webhooks.
        </p>

        <div className="space-y-2 text-sm text-slate-300">
          <p>Current stack:</p>
          <ul className="list-disc list-inside text-slate-300">
            <li>Next.js (App Router, TypeScript)</li>
            <li>Supabase client configured via env vars</li>
            <li>Tailwind CSS for fast UI</li>
          </ul>
        </div>

        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium border border-slate-600 hover:border-slate-400 transition"
          >
            Dashboard (coming soon)
          </Link>
        </div>
      </div>
    </main>
  );
}
