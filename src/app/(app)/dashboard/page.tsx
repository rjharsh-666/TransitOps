"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/components/kpi-card";

type Kpis = {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilizationPct: number;
};

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/kpis").then((response) => response.json()).then(setKpis);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active Vehicles" value={kpis?.activeVehicles ?? 0} />
        <KpiCard label="Available Vehicles" value={kpis?.availableVehicles ?? 0} />
        <KpiCard label="In Maintenance" value={kpis?.vehiclesInMaintenance ?? 0} />
        <KpiCard label="Active Trips" value={kpis?.activeTrips ?? 0} />
        <KpiCard label="Pending Trips" value={kpis?.pendingTrips ?? 0} />
        <KpiCard label="Drivers On Duty" value={kpis?.driversOnDuty ?? 0} />
        <KpiCard label="Fleet Utilization" value={kpis?.fleetUtilizationPct ?? 0} suffix="%" />
      </div>
    </div>
  );
}