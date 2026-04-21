import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PortPagos — Instant settlement for maritime payments.",
  description:
    "The instant settlement network for port agents and shipping companies. Replace SWIFT wires and three-week payment cycles with a single link.",
  metadataBase: new URL("https://portpagos.com"),
  openGraph: {
    title: "PortPagos — Instant settlement for maritime payments.",
    description:
      "The instant settlement network for port agents and shipping companies. Replace SWIFT wires and three-week payment cycles with a single link.",
    type: "website",
    url: "https://portpagos.com",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body
        className="antialiased bg-slate-950 text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
