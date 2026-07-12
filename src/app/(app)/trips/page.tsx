"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Clock3, Filter, Search, ShieldCheck, Truck, Waypoints } from "lucide-react";
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

const lifecycleSteps = [
  { label: "Drafting", detail: "Configuring setup", active: true },
  { label: "Dispatched", detail: "Pending approval" },
  { label: "In Transit", detail: "En route" },
  { label: "Completed", detail: "Closed out" },
];

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

function LifecycleBadge({ active, label, detail, index }: { active?: boolean; label: string; detail: string; index: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-3 text-center">
      <div className={active ? "flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_16px_30px_-16px_rgba(37,99,235,0.8)]" : "flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-400"}>
        {index + 1}
      </div>
      <div>
        <p className={active ? "text-sm font-semibold text-blue-600" : "text-sm font-medium text-slate-700"}>{label}</p>
        <p className="mt-1 text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);

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

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(241,245,249,0.98))] p-5 text-slate-950 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Dispatch Control</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Configure and assign transport routes.</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-full min-w-[240px] max-w-sm items-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-slate-400 shadow-sm sm:w-auto">
            <Search className="h-4 w-4" />
            <span className="text-sm">Search trips...</span>
          </div>
          <button className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <TripFormDialog onCreated={load} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        <SummaryCard label="Draft Trips" value={String(draftCount)} detail="Ready to dispatch" icon={<Waypoints className="h-5 w-5" />} />
        <SummaryCard label="Dispatched" value={String(dispatchedCount)} detail="In motion now" icon={<Truck className="h-5 w-5" />} tone="blue" />
        <SummaryCard label="Completed" value={String(completedCount)} detail="Closed out safely" icon={<ShieldCheck className="h-5 w-5" />} tone="green" />
        <SummaryCard label="Cancelled" value={String(cancelledCount)} detail="Needs follow-up" icon={<Clock3 className="h-5 w-5" />} tone="amber" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Trip Lifecycle</h2>
              <p className="mt-1 text-sm text-slate-500">Dispatch, complete, or cancel trips from here.</p>
            </div>
            <button className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-500">
              View queue <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row">
            {lifecycleSteps.map((step, index) => (
              <LifecycleBadge key={step.label} index={index} active={step.active} label={step.label} detail={step.detail} />
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Pre-Dispatch Checks</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" /> Route weather clear for next 24h.</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-amber-500" /> Selected driver requires rest in 9 hours.</li>
            </ul>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Assignment Panel</h2>
              <p className="mt-1 text-sm text-slate-500">Use the available space for quick dispatch details.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Ready</div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Assigned Route</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">Seattle Distribution Center</p>
              <p className="mt-1 text-sm text-slate-500">To Portland Hub 04</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Estimated Distance</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">280 km</p>
              <p className="mt-1 text-sm text-slate-500">Latest route profile</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200/80">Route Overview</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Origin</p>
                <p className="mt-1 text-sm font-semibold">Seattle Distribution Center</p>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Destination</p>
                <p className="mt-1 text-sm font-semibold">Portland Hub 04</p>
              </div>
            </div>
          </div>
        </div>
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
            {trips.map((trip) => (
              <tr key={trip.id} className="transition-colors hover:bg-slate-50/80">
                <td className="px-4 py-4 font-semibold text-slate-950 sm:px-6">{trip.source} → {trip.destination}</td>
                <td className="py-4 text-slate-700">{trip.vehicle?.registrationNumber ?? "—"}</td>
                <td className="py-4 text-slate-700">{trip.driver?.name ?? "—"}</td>
                <td className="py-4 text-slate-700">{trip.cargoWeight}</td>
                <td className="py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={trip.status} />
                    {trip.status === "Draft" ? (
                      <button type="button" onClick={() => transition(trip.id, "dispatch")} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
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
          </tbody>
        </table>
      </div>
    </div>
  );
}