import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { href: "#product", label: "Overview" },
      { href: "#pricing", label: "Pricing" },
    ],
  },
  {
    title: "For Port Agents",
    links: [{ href: "#for-port-agents", label: "Overview" }],
  },
  {
    title: "For Shipping Companies",
    links: [{ href: "#for-shipping-companies", label: "Overview" }],
  },
  {
    title: "Company",
    links: [
      { href: "/security", label: "Security" },
      { href: "/contact", label: "Contact" },
      { href: "/legal", label: "Legal" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/50 bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-medium uppercase tracking-widest text-slate-500">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-slate-800/50 pt-8 md:flex-row md:items-center">
          <p className="text-sm text-slate-500">
            © 2026 PortPagos. Built for the maritime industry.
          </p>
          <p className="text-xs text-slate-600">
            Running on stablecoin rails. KYC-compliant.
          </p>
        </div>
      </div>
    </footer>
  );
}
