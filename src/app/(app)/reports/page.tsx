"use client";

import { useEffect, useState } from "react";
import { Fuel, Gauge, Search, TrendingDown, TrendingUp, X } from "lucide-react";

type ReportRow = {
  vehicleId: number;
  registrationNumber: string;
  fuelEfficiency: number;
  operationalCost: number;
  totalDistance: number;
  roi: number;
};

function SummaryCard({
  label,
  value,
  detail,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber";
}) {
  const toneClasses: Record<typeof tone, string> = {
    neutral: "border-slate-200/80 bg-white/95 text-slate-950",
    blue: "border-blue-500/20 bg-blue-600 text-white",
    green: "border-emerald-500/20 bg-emerald-600 text-white",
    amber: "border-amber-500/20 bg-amber-500 text-white",
  };

  return (
    <div className={["flex min-h-[104px] items-center justify-between gap-4 rounded-2xl border px-4 py-3 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.45)]", toneClasses[tone]].join(" ")}>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className={tone === "neutral" ? "text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500" : "text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70"}>{label}</p>
        <p className={tone === "neutral" ? "text-2xl font-semibold tracking-tight text-slate-950" : "text-2xl font-semibold tracking-tight text-white"}>{value}</p>
        <p className={tone === "neutral" ? "text-xs text-slate-500" : "text-xs text-white/80"}>{detail}</p>
      </div>
      <div className={tone === "neutral" ? "shrink-0 rounded-2xl bg-slate-100 p-2.5 text-blue-600" : "shrink-0 rounded-2xl bg-white/10 p-2.5 text-white"}>
        {icon}
      </div>
    </div>
  );
}

function BarChart({ rows }: { rows: ReportRow[] }) {
  const maxRevenue = Math.max(...rows.map((row) => row.operationalCost + row.fuelEfficiency * 1000), 1);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">Revenue vs Cost</h2>
          <p className="mt-1 text-sm text-slate-500">Year-to-date performance</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">YTD 2023</div>
      </div>

      <div className="mt-6 grid min-h-[320px] grid-cols-6 items-end gap-4 rounded-2xl border border-slate-100 bg-[linear-gradient(to_top,_rgba(148,163,184,0.06)_1px,_transparent_1px),linear-gradient(to_right,_rgba(148,163,184,0.06)_1px,_transparent_1px)] bg-[length:100%_22px,22px_100%] bg-[position:0_0,0_0] p-4">
        {rows.slice(0, 6).map((row) => {
          const revenueHeight = Math.max(64, Math.round(((row.fuelEfficiency * 1000) / maxRevenue) * 180));
          const costHeight = Math.max(52, Math.round((row.operationalCost / maxRevenue) * 180));

          return (
            <div key={row.vehicleId} className="flex h-full flex-col items-center justify-end gap-2">
              <div className="flex w-full items-end justify-center gap-1.5">
                <div className="w-6 rounded-t-lg bg-blue-600 shadow-[0_16px_24px_-18px_rgba(37,99,235,0.9)]" style={{ height: `${revenueHeight}px` }} />
                <div className="w-6 rounded-t-lg bg-rose-400 shadow-[0_16px_24px_-18px_rgba(251,113,133,0.9)]" style={{ height: `${costHeight}px` }} />
              </div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{row.registrationNumber.slice(-4)}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-blue-600" /> Revenue</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-rose-400" /> Cost</span>
      </div>
    </div>
  );
}

function MetricSpark({ label, subtitle, tone = "blue", accent = false }: { label: string; subtitle: string; tone?: "blue" | "green"; accent?: boolean }) {
  const path = tone === "blue"
    ? "M10 62 C26 48, 40 50, 56 56 S88 66, 104 52 S136 24, 152 28 S184 52, 200 18"
    : "M10 70 C24 66, 40 60, 56 62 S88 68, 104 42 S136 18, 152 26 S184 42, 200 16";

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
      <h2 className="text-lg font-semibold tracking-tight text-slate-950">{label}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className={accent ? "mt-4 rounded-2xl bg-slate-950 p-4 text-white" : "mt-4 rounded-2xl bg-slate-50 p-4"}>
        <svg viewBox="0 0 210 90" className="h-28 w-full">
          <path d={path} fill="none" stroke={tone === "blue" ? "#2563eb" : "#15803d"} strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/reports");
      setRows(await response.json());
    })();
  }, []);

  const totalRevenue = rows.reduce((sum, row) => sum + row.fuelEfficiency * 1000, 0);
  const totalCost = rows.reduce((sum, row) => sum + row.operationalCost, 0);
  const avgRoi = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.roi, 0) / rows.length) : 0;

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(241,245,249,0.98))] p-5 text-slate-950 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Fleet Analytics & ROI</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Executive overview of fleet performance and financial health.</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex h-11 w-full min-w-[240px] max-w-sm items-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-slate-400 shadow-sm sm:w-auto">
            <Search className="h-4 w-4 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports, metrics..."
              className="flex-1 border-0 bg-transparent text-sm text-slate-950 placeholder:text-slate-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="shrink-0 text-slate-400 hover:text-slate-700">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        <SummaryCard label="Monthly Revenue" value={`₹${(totalRevenue / 100000).toFixed(1)}L`} detail="vs last month" icon={<TrendingUp className="h-5 w-5" />} tone="green" />
        <SummaryCard label="Operational Cost" value={`₹${Math.round(totalCost / 1000)}K`} detail="vs last month" icon={<TrendingDown className="h-5 w-5" />} tone="amber" />
        <SummaryCard label="Fleet Utilization" value="92%" detail="Target: 90%" icon={<Gauge className="h-5 w-5" />} tone="blue" />
        <SummaryCard label="Avg ROI" value={`${avgRoi > 0 ? "+" : ""}${avgRoi}%`} detail="Across top vehicles" icon={<Fuel className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.85fr)]">
        <BarChart rows={rows} />

        <div className="grid gap-4">
          <MetricSpark label="Fleet Utilization" subtitle="Active vehicles vs idle" tone="blue" accent />
          <MetricSpark label="Fuel Efficiency" subtitle="Fleet average (km/L)" tone="green" />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">Top Vehicles by ROI</h2>
            <p className="mt-1 text-sm text-slate-500">Summary of fleet efficiency and return on investment.</p>
          </div>
          <button className="text-sm font-semibold text-blue-600 transition hover:text-blue-500">View All</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50/90 text-left text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            <tr>
              <th className="px-4 py-3 sm:px-6">Vehicle ID</th>
              <th>Type</th>
              <th>Revenue Generated</th>
              <th>Maintenance Cost</th>
              <th>Net ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows
            .filter(
              (row) =>
                !search ||
                row.registrationNumber.toLowerCase().includes(search.toLowerCase())
            )
            .map((row) => (
              <tr key={row.vehicleId} className="transition-colors hover:bg-slate-50/80">
                <td className="px-4 py-4 font-semibold text-slate-950 sm:px-6">{row.registrationNumber}</td>
                <td className="py-4 text-slate-700">Fleet Unit</td>
                <td className="py-4 text-slate-700">₹{row.fuelEfficiency.toFixed(1)}K</td>
                <td className="py-4 text-slate-700">₹{row.operationalCost.toLocaleString("en-IN")}</td>
                <td className={row.roi >= 0 ? "py-4 font-semibold text-emerald-600" : "py-4 font-semibold text-rose-600"}>{row.roi > 0 ? `+${row.roi}%` : `${row.roi}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}