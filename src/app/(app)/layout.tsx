import { ReactNode } from "react";
import { ClientWeb3Provider } from "@/components/ClientWeb3Provider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <ClientWeb3Provider>{children}</ClientWeb3Provider>;
}
