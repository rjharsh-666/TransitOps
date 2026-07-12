export type Role = "Pending" | "Admin" | "FleetManager" | "Driver" | "SafetyOfficer" | "FinancialAnalyst";

export const PAGE_ACCESS: Record<string, Role[]> = {
  "/dashboard": ["Admin", "FleetManager", "Driver", "SafetyOfficer", "FinancialAnalyst"],
  "/admin": ["Admin", "FleetManager"],
  "/vehicles": ["Admin", "FleetManager"],
  "/drivers": ["Admin", "FleetManager", "SafetyOfficer"],
  "/trips": ["Admin", "FleetManager", "Driver"],
  "/maintenance": ["Admin", "FleetManager"],
  "/fuels": ["Admin", "FleetManager", "FinancialAnalyst"],
  "/expenses": ["Admin", "FleetManager", "FinancialAnalyst"],
  "/reports": ["Admin", "FleetManager", "FinancialAnalyst"],
};

export function isAllowed(pathname: string, role: Role | undefined): boolean {
  if (!role) return false;

  const match = Object.keys(PAGE_ACCESS).find((path) => pathname.startsWith(path));

  if (!match) return true;

  return PAGE_ACCESS[match].includes(role);
}

export function assertRole(role: Role | undefined, allowed: Role[]) {
  if (!role || !allowed.includes(role)) {
    const err = new Error("Forbidden") as Error & { status?: number };
    err.status = 403;
    throw err;
  }
}