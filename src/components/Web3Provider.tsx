"use client";

import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmiConfig";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Create a single QueryClient instance
const queryClient = new QueryClient();

// Initialize Web3Modal v4
createWeb3Modal({
  wagmiConfig,
  projectId,
  enableAnalytics: false,
  themeMode: "dark",
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
    </QueryClientProvider>
  );
}
