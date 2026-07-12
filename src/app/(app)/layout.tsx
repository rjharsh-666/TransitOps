import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavSidebar } from "@/components/nav-sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === "Pending") {
      redirect(user.signupType === "Driver" ? "/driver-awaiting-approval" : "/role-request");
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-950">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}