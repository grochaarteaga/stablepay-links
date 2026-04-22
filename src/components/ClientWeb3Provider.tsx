"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";

const Web3Provider = dynamic(
  () => import("@/components/Web3Provider").then((m) => m.Web3Provider),
  { ssr: false }
);

export function ClientWeb3Provider({ children }: { children: ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}
