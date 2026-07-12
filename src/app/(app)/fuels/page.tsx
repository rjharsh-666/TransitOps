"use client";

import { useEffect, useState } from "react";
import { Search, Download, Zap, Fuel } from "lucide-react";
import { FuelLogFormDialog } from "@/components/fuel-log-form-dialog";

type FuelLog = {
  id: number;
  liters: string;
  cost: string;
  logDate: string;
  vehicle: { registrationNumber: string };
  fuelType?: string;
};

type FuelMetrics = {
  totalSpend: number;
  avgPrice: number;
  efficiency: number;
  totalVolume: number;
  trend?: number;
};

function StatCard({ 
  label, 
  value, 
  suffix = "", 
  accent = false,
  trend,
  icon
}: { 
  label: string; 
  value: string | number; 
  suffix?: string;
  accent?: boolean;
  trend?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={[
        "flex min-h-[104px] items-center justify-between gap-4 rounded-2xl border px-4 py-3 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.45)]",
        accent
          ? "border-blue-500/20 bg-blue-600 text-white"
          : "border-slate-200/80 bg-white/95 text-slate-950",
      ].join(" ")}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className={accent ? "text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-100/80" : "text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500"}>
          {label}
        </p>
        <div>
          <p className={accent ? "text-2xl font-semibold tracking-tight text-white xl:text-3xl" : "text-2xl font-semibold tracking-tight text-slate-950 xl:text-3xl"}>
            {value}
            {suffix && <span className={accent ? "text-lg text-blue-100/80 ml-1" : "text-lg text-slate-500 ml-1"}>{suffix}</span>}
          </p>
          {trend !== undefined && (
            <p className={accent ? "mt-1 text-xs text-blue-100/85" : "mt-1 text-xs text-slate-500"}>
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
      </div>
      {icon && (
        <div className={accent ? "shrink-0 rounded-2xl bg-white/10 p-2.5 text-white" : "shrink-0 rounded-2xl bg-slate-100 p-2.5 text-blue-600"}>
          {icon}
        </div>
      )}
    </div>
  );
}

export default function FuelsPage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [metrics, setMetrics] = useState<FuelMetrics>({
    totalSpend: 0,
    avgPrice: 0,
    efficiency: 0,
    totalVolume: 0,
  });

  async function load() {
    const fuelResponse = await fetch("/api/fuel-logs");
    const logs = await fuelResponse.json();
    setFuelLogs(logs);

    // Calculate metrics
    if (Array.isArray(logs) && logs.length > 0) {
      const totalCost = logs.reduce((sum, log) => sum + parseFloat(log.cost || 0), 0);
      const totalLiters = logs.reduce((sum, log) => sum + parseFloat(log.liters || 0), 0);
      const avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;

      setMetrics({
        totalSpend: totalCost,
        avgPrice: avgPrice,
        efficiency: 24.6, // This would come from a calculation with distance and fuel
        totalVolume: totalLiters,
        trend: -4,
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const fuelTypes = [...new Set(fuelLogs.map(log => log.fuelType))].filter(Boolean);

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(241,245,249,0.98))] p-5 text-slate-950 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.45)]">
      {/* Header Section */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Fleet Management</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Fuel Management</h1>
          <p className="mt-2 text-sm text-slate-500">Monitor fuel efficiency and consumption across all transit assets.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-full min-w-[260px] max-w-sm items-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-slate-400 shadow-sm sm:w-auto">
            <Search className="h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search vehicle ID..."
              className="w-full bg-transparent text-sm text-slate-950 outline-none"
            />
          </div>
          <button className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <FuelLogFormDialog onCreated={load} />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Fuel Spend"
          value={`₹${metrics.totalSpend.toLocaleString()}`}
          trend={metrics.trend}
          icon={<Fuel className="h-4 w-4" />}
        />
        <StatCard
          label="Avg. Fuel Price"
          value={`₹${metrics.avgPrice.toFixed(2)}`}
          suffix="/L"
          icon={<Zap className="h-4 w-4" />}
        />
        <StatCard
          label="Fleet Efficiency"
          value={metrics.efficiency}
          suffix="L/100km"
          accent
          icon={<Zap className="h-4 w-4" />}
        />
        <StatCard
          label="Total Volume"
          value={`${(metrics.totalVolume / 1000).toFixed(0)}k`}
          suffix="Liters"
          icon={<Fuel className="h-4 w-4" />}
        />
      </div>

      {/* Filters and Table Section */}
      <div className="mt-6">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search vehicle ID..."
            className="px-4 py-2 rounded-full border border-slate-200 text-sm bg-white/50"
          />
          <select className="px-4 py-2 rounded-full border border-slate-200 text-sm bg-white/50">
            <option>Last 30 Days</option>
            <option>Last 60 Days</option>
            <option>Last 90 Days</option>
          </select>
          {fuelTypes.length > 0 && (
            <select className="px-4 py-2 rounded-full border border-slate-200 text-sm bg-white/50">
              <option value="">All Fuel Types</option>
              {fuelTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 text-left text-slate-500 border-b border-slate-200/50">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Fuel Type</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Liters/kWh</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Cost</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {fuelLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No fuel logs yet. Add your first fuel log to get started.
                  </td>
                </tr>
              ) : (
                fuelLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-medium text-slate-950">{new Date(log.logDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-slate-950">{log.vehicle?.registrationNumber ?? "—"}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700">
                        {log.fuelType || "Standard"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{log.liters}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">₹{log.cost}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="text-emerald-600 font-semibold">24.2/100</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {fuelLogs.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Showing 1-{fuelLogs.length} of {fuelLogs.length} fuel logs</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50">Previous</button>
              <button className="px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
