import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "PortPagos",
  description: "Get paid faster. No banks. No delays.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
