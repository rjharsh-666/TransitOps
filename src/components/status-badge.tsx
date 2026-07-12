import { cn } from "@/lib/utils";

const COLORS: Record<string, string> = {
  Available: "bg-emerald-500/15 text-emerald-600",
  OnTrip: "bg-blue-500/15 text-blue-600",
  InShop: "bg-amber-500/15 text-amber-600",
  Retired: "bg-zinc-500/15 text-zinc-500",
  OffDuty: "bg-zinc-500/15 text-zinc-500",
  Suspended: "bg-red-500/15 text-red-600",
  Draft: "bg-zinc-500/15 text-zinc-500",
  Dispatched: "bg-blue-500/15 text-blue-600",
  Completed: "bg-emerald-500/15 text-emerald-600",
  Cancelled: "bg-red-500/15 text-red-600",
  Open: "bg-amber-500/15 text-amber-600",
  Closed: "bg-emerald-500/15 text-emerald-600",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", COLORS[status] ?? "bg-zinc-500/15 text-zinc-500")}>{status}</span>;
}