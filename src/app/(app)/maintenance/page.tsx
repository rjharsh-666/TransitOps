"use client";

import { useEffect, useState } from "react";
import { Clock3, Filter, IndianRupee, Plus, Search, ShieldCheck, Wrench, X } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { MaintenanceFormDialog } from "@/components/maintenance-form-dialog";

type Log = {
  id: number;
  maintenanceType: string;
  cost: string;
  status: string;
  startDate: string;
  description?: string;
  vehicle: { registrationNumber: string };
};

function SummaryCard({ label, value, detail, icon, tone = "neutral" }: { label: string; value: string; detail: string; icon: React.ReactNode; tone?: "neutral" | "blue" | "green" | "amber" }) {
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

const STATUS_OPTIONS = ["All", "Open", "Closed"];

export default function MaintenancePage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  async function load() {
    const response = await fetch("/api/maintenance");
    setLogs(await response.json());
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  async function toggleStatus(log: Log) {
    if (toggling) return;
    setToggling(log.id);
    try {
      const action = log.status === "Open" ? "close" : "reopen";
      const response = await fetch(`/api/maintenance/${log.id}/${action === "close" ? "close" : "reopen"}`, { method: "POST" });
      if (response.ok) await load();
    } finally {
      setToggling(null);
    }
  }

  const openLogs = logs.filter((log) => log.status === "Open").length;
  const closedLogs = logs.filter((log) => log.status === "Closed").length;
  const activeLogs = logs.filter((log) => log.status !== "Closed").length;
  const totalCost = logs.reduce((sum, log) => sum + Number(log.cost || 0), 0);

  const filtered = logs.filter((log) => {
    const matchSearch =
      !search ||
      log.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      log.maintenanceType.toLowerCase().includes(search.toLowerCase()) ||
      (log.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || log.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(241,245,249,0.98))] p-5 text-slate-950 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Fleet Maintenance</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Maintenance</h1>
          <p className="mt-2 text-sm text-slate-500">Manage vehicle repairs and scheduled services.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Functional Search */}
          <div className="relative flex h-11 w-full min-w-[240px] max-w-sm items-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-slate-400 shadow-sm sm:w-auto">
            <Search className="h-4 w-4 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vehicles, issues..."
              className="flex-1 border-0 bg-transparent text-sm text-slate-950 placeholder:text-slate-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="shrink-0 text-slate-400 hover:text-slate-700">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowFilter((p) => !p)}
              className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium shadow-sm transition ${showFilter ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              <Filter className="h-4 w-4" />
              {statusFilter === "All" ? "Filter" : statusFilter}
            </button>
            {showFilter && (
              <div className="absolute right-0 top-full z-20 mt-2 w-36 rounded-2xl border border-slate-200 bg-white shadow-xl">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setShowFilter(false); }}
                    className={`flex w-full items-center px-4 py-2.5 text-sm transition first:rounded-t-2xl last:rounded-b-2xl ${statusFilter === s ? "bg-slate-950 text-white font-semibold" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <MaintenanceFormDialog onCreated={load} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        <SummaryCard label="Open" value={String(openLogs)} detail="Needs attention" icon={<Wrench className="h-5 w-5" />} />
        <SummaryCard label="In Progress" value={String(activeLogs - openLogs)} detail="Active repairs" icon={<Clock3 className="h-5 w-5" />} tone="blue" />
        <SummaryCard label="Completed" value={String(closedLogs)} detail="Closed service logs" icon={<ShieldCheck className="h-5 w-5" />} tone="green" />
        <SummaryCard label="Total Cost" value={`₹${totalCost.toLocaleString("en-IN")}`} detail="Across all records" icon={<IndianRupee className="h-5 w-5" />} tone="amber" />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/90 text-left text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            <tr>
              <th className="px-4 py-3 sm:px-6">Vehicle</th>
              <th>Type</th>
              <th>Cost</th>
              <th>Started</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((log) => (
              <tr key={log.id} className="transition-colors hover:bg-slate-50/80">
                <td className="px-4 py-4 font-semibold text-slate-950 sm:px-6">{log.vehicle?.registrationNumber ?? "—"}</td>
                <td className="py-4 text-slate-700">{log.maintenanceType}</td>
                <td className="py-4 text-slate-700">₹{Number(log.cost).toLocaleString("en-IN")}</td>
                <td className="py-4 text-slate-700">{new Date(log.startDate).toLocaleDateString("en-IN")}</td>
                <td className="py-4"><StatusBadge status={log.status} /></td>
                <td className="py-4">
                  <button
                    type="button"
                    disabled={toggling === log.id}
                    onClick={() => toggleStatus(log)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium shadow-sm transition disabled:opacity-50 ${
                      log.status === "Open"
                        ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                        : "border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                    }`}
                  >
                    {toggling === log.id ? "…" : log.status === "Open" ? "Mark Closed" : "Reopen"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                  {search || statusFilter !== "All" ? "No records match your search or filter." : "No maintenance records yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}