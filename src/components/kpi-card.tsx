import { Users, Truck, TrendingUp, FileCheck } from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  "TOTAL ACTIVE": <Users className="h-6 w-6 text-blue-600" />,
  "ON TRIP": <Truck className="h-6 w-6 text-teal-600" />,
  "AVG SAFETY SCORE": <TrendingUp className="h-6 w-6 text-amber-600" />,
  "EXPIRING DOCS": <FileCheck className="h-6 w-6 text-red-600" />,
};

export function KpiCard({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  const icon = ICON_MAP[label];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase text-slate-600 tracking-wider">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            {value}
            {suffix && <span className="text-lg text-slate-500 ml-1">{suffix}</span>}
          </p>
        </div>
        {icon && <div className="ml-4 flex-shrink-0">{icon}</div>}
      </div>
    </div>
  );
}