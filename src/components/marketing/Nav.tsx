import Link from "next/link";

const navLinks = [
  { href: "#product", label: "Product" },
  { href: "#for-port-agents", label: "For Port Agents" },
  { href: "#for-shipping-companies", label: "For Shipping Companies" },
  { href: "#pricing", label: "Pricing" },
  { href: "/login", label: "Login" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-white">
            PortPagos
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
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

        <Link
          href="/signup"
          className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-500"
        >
          Get started
        </Link>
      </nav>
    </header>
  );
}
