"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", roles: ["Admin", "FleetManager", "Driver", "SafetyOfficer", "FinancialAnalyst"] },
  { href: "/admin", label: "Admin", roles: ["Admin", "FleetManager"] },
  { href: "/vehicles", label: "Vehicles", roles: ["Admin", "FleetManager"] },
  { href: "/drivers", label: "Drivers", roles: ["Admin", "FleetManager", "SafetyOfficer"] },
  { href: "/trips", label: "Trips", roles: ["Admin", "FleetManager", "Driver"] },
  { href: "/maintenance", label: "Maintenance", roles: ["Admin", "FleetManager"] },
  { href: "/fuel-expenses", label: "Fuel & Expenses", roles: ["Admin", "FleetManager", "FinancialAnalyst"] },
  { href: "/reports", label: "Reports", roles: ["Admin", "FleetManager", "FinancialAnalyst"] },
];

export function NavSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-slate-200 bg-white px-4 py-5">
      <div>
        <div className="px-2 text-lg font-semibold tracking-tight text-slate-950">TransitOps</div>
        <nav className="mt-6 flex flex-col gap-1">
          {LINKS.filter((link) => !role || link.roles.includes(role)).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950",
                pathname.startsWith(link.href) && "bg-slate-950 text-white hover:bg-slate-950 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
        <UserButton />
        <div>
          <p className="text-sm font-medium text-slate-900">{role ?? "User"}</p>
          <p className="text-xs text-slate-500">Account</p>
        </div>
      </div>
    </aside>
  );
}