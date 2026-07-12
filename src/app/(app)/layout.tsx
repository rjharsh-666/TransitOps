import { NavSidebar } from "@/components/nav-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}