import { ReactNode } from "react";
import { ClientWeb3Provider } from "@/components/ClientWeb3Provider";
import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ClientWeb3Provider>
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <div className="flex-1 min-w-0 md:ml-56">
          {children}
        </div>
      </div>
    </ClientWeb3Provider>
  );
}
