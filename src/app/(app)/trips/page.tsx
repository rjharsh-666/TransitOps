"use client";

import { useEffect, useState } from "react";
import { Clock3, Filter, Plus, Search, ShieldCheck, Truck, Waypoints, X } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { TripCompleteDialog } from "@/components/trip-complete-dialog";
import { TripFormDialog } from "@/components/trip-form-dialog";

type Trip = {
  id: number;
  source: string;
  destination: string;
  status: string;
  cargoWeight: string;
  vehicle: { registrationNumber: string };
  driver: { name: string };
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

const STATUS_OPTIONS = ["All", "Draft", "Dispatched", "Completed", "Cancelled"];

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);

  async function load() {
    const response = await fetch("/api/trips");
    setTrips(await response.json());
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  async function transition(id: number, action: "dispatch" | "complete" | "cancel") {
    const response = await fetch(`/api/trips/${id}/${action}`, { method: "POST" });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? `Failed to ${action} trip`);
    }
    await load();
  }

  const draftCount = trips.filter((trip) => trip.status === "Draft").length;
  const dispatchedCount = trips.filter((trip) => trip.status === "Dispatched").length;
  const completedCount = trips.filter((trip) => trip.status === "Completed").length;
  const cancelledCount = trips.filter((trip) => trip.status === "Cancelled").length;

  const filtered = trips.filter((trip) => {
    const matchSearch =
      !search ||
      trip.source.toLowerCase().includes(search.toLowerCase()) ||
      trip.destination.toLowerCase().includes(search.toLowerCase()) ||
      trip.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      trip.driver?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || trip.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(241,245,249,0.98))] p-5 text-slate-950 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Dispatch Control</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Trips</h1>
          <p className="mt-2 text-sm text-slate-500">Configure and assign transport routes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Functional Search */}
          <div className="relative flex h-11 w-full min-w-[240px] max-w-sm items-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-slate-400 shadow-sm sm:w-auto">
            <Search className="h-4 w-4 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trips, drivers..."
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
              <div className="absolute right-0 top-full z-20 mt-2 w-40 rounded-2xl border border-slate-200 bg-white shadow-xl">
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

          <TripFormDialog onCreated={load} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        <SummaryCard label="Draft Trips" value={String(draftCount)} detail="Ready to dispatch" icon={<Waypoints className="h-5 w-5" />} />
        <SummaryCard label="Dispatched" value={String(dispatchedCount)} detail="In motion now" icon={<Truck className="h-5 w-5" />} tone="blue" />
        <SummaryCard label="Completed" value={String(completedCount)} detail="Closed out safely" icon={<ShieldCheck className="h-5 w-5" />} tone="green" />
        <SummaryCard label="Cancelled" value={String(cancelledCount)} detail="Needs follow-up" icon={<Clock3 className="h-5 w-5" />} tone="amber" />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/90 text-left text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            <tr>
              <th className="px-4 py-3 sm:px-6">Route</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Cargo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((trip) => (
              <tr key={trip.id} className="transition-colors hover:bg-slate-50/80">
                <td className="px-4 py-4 font-semibold text-slate-950 sm:px-6">{trip.source} → {trip.destination}</td>
                <td className="py-4 text-slate-700">{trip.vehicle?.registrationNumber ?? "—"}</td>
                <td className="py-4 text-slate-700">{trip.driver?.name ?? "—"}</td>
                <td className="py-4 text-slate-700">{trip.cargoWeight} kg</td>
                <td className="py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={trip.status} />
                    {trip.status === "Draft" ? (
                      <button type="button" onClick={() => transition(trip.id, "dispatch")} className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-sm transition hover:bg-blue-50">
                        Dispatch
                      </button>
                    ) : null}
                    {trip.status === "Dispatched" ? (
                      <TripCompleteDialog tripId={trip.id} onCompleted={load} />
                    ) : null}
                    {trip.status === "Dispatched" ? (
                      <button type="button" onClick={() => transition(trip.id, "cancel")} className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 shadow-sm transition hover:bg-red-50">
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                  {search || statusFilter !== "All" ? "No trips match your search or filter." : "No trips yet. Create your first trip to get started."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}