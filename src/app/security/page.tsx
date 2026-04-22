import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";

const pillars = [
  {
    title: "Infrastructure",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
      </svg>
    ),
    items: [
      "Hosted on Supabase (SOC 2 Type II certified infrastructure)",
      "All data encrypted at rest using AES-256",
      "All data in transit protected by TLS 1.3",
      "Database access restricted to service-role credentials; no direct public exposure",
      "Automatic backups with point-in-time recovery",
    ],
  },
  {
    title: "Authentication",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    items: [
      "Wallet-based authentication via Privy — no passwords stored",
      "Server-side session validation on every authenticated request",
      "Row-level security (RLS) enforced at the database layer — users can only access their own data",
      "All sensitive keys stored as environment variables, never in source code",
    ],
  },
  {
    title: "Financial integrity",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    items: [
      "Immutable ledger — entries cannot be updated or deleted, enforced at the database level by triggers",
      "Idempotency keys on all ledger writes prevent double-crediting from duplicate webhooks",
      "Materialised balance table maintained atomically by database triggers — no balance is ever computed from a mutable scan",
      "HMAC-SHA256 signature verification on all inbound webhooks (Alchemy, Bridge)",
      "Unique index on transaction hash prevents replay attacks",
    ],
  },
  {
    title: "Funds & custody",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    items: [
      "PortPagos never custodies customer funds",
      "Fiat funds held by Bridge, a licensed money services business",
      "USDC held in self-custodied wallets on Base mainnet — cryptographically controlled by the account holder",
      "USDC issued by Circle, backed 1:1 by USD reserves independently attested monthly",
      "On-chain settlement is final and verifiable on a public blockchain",
    ],
  },
  {
    title: "Compliance",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    items: [
      "KYB (Know Your Business) verification required for all merchant accounts",
      "KYC verification performed for individual users",
      "AML screening on all transactions via Bridge's compliance infrastructure",
      "Sanctions screening against OFAC, EU, and UN lists",
      "Transaction records retained for 5 years in compliance with AML regulations",
    ],
  },
  {
    title: "Responsible disclosure",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44a23.916 23.916 0 001.152 6.061M12 12.75c-1.082-.02-2.157-.103-3.22-.248a23.942 23.942 0 01-1.5-5.002m4.72 5.25c1.082-.02 2.157-.103 3.22-.248a23.944 23.944 0 001.5-5.003" />
      </svg>
    ),
    items: [
      "We take security reports seriously and respond within 48 hours",
      "Please disclose vulnerabilities responsibly to guillermo@portpagos.com",
      "Do not access or modify data belonging to other users during testing",
      "We do not pursue legal action against good-faith security researchers",
    ],
  },
];

export default function SecurityPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-slate-950 py-24">
        <div className="mx-auto max-w-7xl px-6">

          {/* Header */}
          <div className="mx-auto max-w-2xl mb-20">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Security
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Built for financial operations.
            </h1>
            <p className="mt-6 text-lg text-slate-400">
              PortPagos handles real money for real businesses. Every layer of the platform —
              from the database to the settlement network — is designed with that in mind.
            </p>
          </div>

          {/* Pillars grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-xl border border-slate-800 bg-slate-900 p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600/10 text-green-400">
                    {pillar.icon}
                  </div>
                  <h2 className="text-base font-semibold text-white">{pillar.title}</h2>
                </div>
                <ul className="space-y-3">
                  {pillar.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-400">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Trust banner */}
          <div className="mt-16 rounded-xl border border-slate-800 bg-slate-900 p-8 md:p-12">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:divide-x md:divide-slate-800">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">SOC 2</p>
                <p className="mt-1 text-sm text-slate-400">Infrastructure certified</p>
                <p className="mt-1 text-xs text-slate-600">via Supabase</p>
              </div>
              <div className="text-center md:pl-10">
                <p className="text-2xl font-bold text-green-400">Licensed</p>
                <p className="mt-1 text-sm text-slate-400">Financial partners</p>
                <p className="mt-1 text-xs text-slate-600">Bridge + Circle</p>
              </div>
              <div className="text-center md:pl-10">
                <p className="text-2xl font-bold text-green-400">GDPR</p>
                <p className="mt-1 text-sm text-slate-400">Data protection compliant</p>
                <p className="mt-1 text-xs text-slate-600">EU data residency</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500">
              Security questions or vulnerability reports?{" "}
              <a
                href="mailto:guillermo@portpagos.com"
                className="text-green-400 hover:text-green-300 transition"
              >
                guillermo@portpagos.com
              </a>
            </p>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
