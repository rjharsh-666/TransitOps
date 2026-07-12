"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ArrowRight, Bell, Download, MoonStar, Plus, Search, Truck, Users, Wrench } from "lucide-react";

type Kpis = {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilizationPct: number;
  weeklyTrend?: number[];
};

const weeklyTrend = [38, 66, 50, 84, 95, 88, 72, 98];



function StatCard({ label, value, sublabel, accent = false }: { label: string; value: string; sublabel?: string; accent?: boolean }) {
  return (
    <div
      className={[
        "flex min-h-[92px] items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur-sm",
        accent
          ? "border-blue-500/20 bg-blue-600 text-white"
          : "border-slate-200/70 bg-white/95 text-slate-950",
      ].join(" ")}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
        <p className={accent ? "text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-100/80" : "text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500"}>
          {label}
        </p>
        <div>
          <p className={accent ? "text-2xl font-semibold tracking-tight text-white xl:text-3xl" : "text-2xl font-semibold tracking-tight text-slate-950 xl:text-3xl"}>
            {value}
          </p>
          {sublabel ? <p className={accent ? "mt-1 text-xs text-blue-100/85" : "mt-1 text-xs text-slate-500"}>{sublabel}</p> : null}
        </div>
      </div>
      <div className={accent ? "shrink-0 rounded-2xl bg-white/10 p-2.5 text-white" : "shrink-0 rounded-2xl bg-slate-100 p-2.5 text-blue-600"}>
        <Truck className="h-4 w-4" />
      </div>
    </div>
  );
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const toneClasses = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
  };

  return <span className={[
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
    toneClasses[tone],
  ].join(" ")}>{children}</span>;
}

export default function DashboardPage() {
  const { isLoaded, user } = useUser();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const role = user?.publicMetadata?.role as string | undefined;
  const canCreateVehicle = isLoaded && (role === "Admin" || role === "FleetManager");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [kpiRes, tripsRes, maintRes] = await Promise.all([
          fetch("/api/dashboard/kpis"),
          fetch("/api/trips?status=Dispatched"),
          fetch("/api/maintenance"),
        ]);

        const [kpiData, tripsData, maintData] = await Promise.all([
          kpiRes.json(),
          tripsRes.json(),
          maintRes.json(),
        ]);

        setKpis(kpiData);

        if (Array.isArray(tripsData)) {
          const mappedTrips = tripsData.map((trip: any) => ({
            tripId: `TRP-${trip.id}`,
            driver: trip.driver?.name ?? "Unknown",
            route: `${trip.source} → ${trip.destination}`,
            status: trip.status === "Dispatched" ? "On Time" : trip.status,
            eta: trip.dispatchedAt
              ? new Date(new Date(trip.dispatchedAt).getTime() + 4 * 60 * 60 * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "18:00 EST",
          }));
          setDispatches(mappedTrips.slice(0, 3));
        }

        if (Array.isArray(maintData)) {
          const openMaint = maintData
            .filter((log: any) => log.status === "Open")
            .map((log: any) => ({
              title: `Vehicle #${log.vehicle?.registrationNumber ?? log.vehicleId} - ${log.maintenanceType}`,
              detail: `${log.description || "Scheduled maintenance"} · Cost: ₹${Number(log.cost).toFixed(0)}`,
              tone: Number(log.cost) > 200 ? "urgent" : "warning",
            }));
          setActionItems(openMaint.slice(0, 2));
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    }

    loadDashboardData();
  }, []);

  const totalVehicles = (kpis?.activeVehicles ?? 0) + (kpis?.availableVehicles ?? 0) + (kpis?.vehiclesInMaintenance ?? 0);
  const activeShare = totalVehicles ? Math.round(((kpis?.activeVehicles ?? 0) / totalVehicles) * 100) : 0;
  const idleShare = totalVehicles ? Math.round(((kpis?.availableVehicles ?? 0) / totalVehicles) * 100) : 0;
  const shopShare = totalVehicles ? Math.round(((kpis?.vehiclesInMaintenance ?? 0) / totalVehicles) * 100) : 0;
  const offlineShare = Math.max(0, 100 - activeShare - idleShare - shopShare);
  const utilization = kpis?.fleetUtilizationPct ?? 0;

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(241,245,249,0.98))] p-5 text-slate-950 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Executive Overview</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Real-time metrics for network operations.</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-full min-w-[260px] max-w-sm items-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-slate-400 shadow-sm sm:w-auto">
            <Search className="h-4 w-4" />
            <span className="text-sm">Search vehicles, drivers, routes...</span>
          </div>
          <button className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Export
          </button>
          {canCreateVehicle ? (
            <Link
              href="/vehicles/add"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-medium text-white shadow-[0_18px_40px_-18px_rgba(37,99,235,0.85)] transition hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Link>
          ) : null}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Fleet Status"
          value={String(totalVehicles)}
          sublabel="Total vehicles"
        />
        <StatCard
          label="Active Trips"
          value={String(kpis?.activeTrips ?? 0)}
          sublabel={`${kpis?.pendingTrips ?? 0} pending`}
        />
        <StatCard
          label="Maintenance"
          value={String(kpis?.vehiclesInMaintenance ?? 0)}
          sublabel="Vehicles in shop"
        />
        <StatCard
          label="Fleet Utilization"
          value={`${utilization}%`}
          sublabel="Target: 85%"
          accent
        />
      </div>

      {/* Charts Row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Vehicle Status Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Vehicle Status</h2>
              <p className="mt-1 text-sm text-slate-500">Distribution across active, idle, shop, and offline units.</p>
            </div>
            <Badge tone="neutral">Updated now</Badge>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div
              className="relative flex h-44 w-44 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#2563eb 0 ${activeShare}%, #5eead4 ${activeShare}% ${activeShare + idleShare}%, #dc2626 ${activeShare + idleShare}% ${activeShare + idleShare + shopShare}%, #94a3b8 ${activeShare + idleShare + shopShare}% 100%)`,
              }}
            >
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                <p className="text-3xl font-semibold tracking-tight text-slate-950">{totalVehicles}</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Total</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-600" /> Active ({activeShare}%)</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-300" /> Idle ({idleShare}%)</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-600" /> Shop ({shopShare}%)</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-400" /> Offline ({offlineShare}%)</div>
          </div>
        </div>

        {/* Fleet Utilization Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Fleet Utilization</h2>
              <p className="mt-1 text-sm text-slate-500">Target coverage and weekly performance trend.</p>
            </div>
            <Badge tone="success">Last 30 days</Badge>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.8)]">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-blue-200/80">Utilization</p>
                <p className="mt-2 text-5xl font-semibold tracking-tight">{utilization}%</p>
                <p className="mt-2 text-sm text-slate-300">Target 85% vs current fleet use.</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-blue-100">On track</div>
            </div>

            <div className="mt-6 grid grid-cols-8 items-end gap-3">
              {(kpis?.weeklyTrend ?? weeklyTrend).map((value, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-2xl bg-gradient-to-t from-blue-500 to-cyan-300 shadow-[0_16px_24px_-18px_rgba(96,165,250,0.9)]"
                    style={{ height: `${value}px` }}
                  />
                  <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">W{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs xl:text-sm font-medium whitespace-nowrap"><Users className="h-4 w-4" /> Drivers on duty</div>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{kpis?.driversOnDuty ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs xl:text-sm font-medium whitespace-nowrap"><Wrench className="h-4 w-4" /> Maintenance</div>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{kpis?.vehiclesInMaintenance ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs xl:text-sm font-medium whitespace-nowrap"><MoonStar className="h-4 w-4" /> Pending</div>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{kpis?.pendingTrips ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)]">
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Active Dispatches</h2>
              <p className="mt-1 text-sm text-slate-500">Live trips and route assignments.</p>
            </div>
            <button className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-500">
              View all <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80">
            <div className="grid grid-cols-[1.1fr_1fr_1.2fr_0.8fr_0.7fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              <span>Trip ID</span>
              <span>Driver</span>
              <span>Route</span>
              <span>Status</span>
              <span>ETA</span>
            </div>
            <div className="divide-y divide-slate-100 bg-white">
              {dispatches.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">No active dispatches.</div>
              ) : (
                dispatches.map((dispatch) => (
                  <div key={dispatch.tripId} className="grid grid-cols-[1.1fr_1fr_1.2fr_0.8fr_0.7fr] gap-4 px-4 py-4 text-sm">
                    <span className="font-semibold text-blue-600">{dispatch.tripId}</span>
                    <span className="text-slate-700">{dispatch.driver}</span>
                    <span className="text-slate-700">{dispatch.route}</span>
                    <span>
                      <Badge tone={dispatch.status === "On Time" ? "success" : "warning"}>{dispatch.status}</Badge>
                    </span>
                    <span className={dispatch.status === "Delayed" ? "font-semibold text-rose-600" : "font-semibold text-slate-700"}>{dispatch.eta}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">Action Required</h2>
                <p className="mt-1 text-sm text-slate-500">Items needing attention today.</p>
              </div>
              <Badge tone={actionItems.length > 0 ? "danger" : "neutral"}>
                {actionItems.length} {actionItems.length === 1 ? "alert" : "alerts"}
              </Badge>
            </div>

            <div className="mt-5 space-y-3">
              {actionItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 bg-slate-50/50">
                  All systems clear. No actions required.
                </div>
              ) : (
                actionItems.map((item) => (
                  <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className={item.tone === "urgent" ? "rounded-xl bg-rose-100 p-2 text-rose-600" : "rounded-xl bg-amber-100 p-2 text-amber-600"}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-blue-600 p-5 text-white shadow-[0_18px_55px_-30px_rgba(37,99,235,0.85)]">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-100/80">Fleet Utilization</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">{utilization}%</p>
            <p className="mt-2 max-w-xs text-sm text-blue-100/85">Focus on dispatch efficiency and keep vehicles moving toward the 85% target.</p>
          </div>
        </div>
      </div>
    </div>
  );
}