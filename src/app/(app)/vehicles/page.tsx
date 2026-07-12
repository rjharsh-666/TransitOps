"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Filter, Search, ShieldCheck, Truck, Wrench, Route } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { VehicleFormDialog } from "@/components/vehicle-form-dialog";

type Vehicle = {
  id: number;
  registrationNumber: string;
  nameModel: string;
  type: string;
  maxLoadCapacity: string;
  odometer: string;
  region: string | null;
  status: string;
};

type SummaryTone = "neutral" | "blue" | "green" | "amber";

function SummaryCard({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: SummaryTone;
}) {
  const toneClasses: Record<SummaryTone, string> = {
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
      </div>
      <div className={tone === "neutral" ? "shrink-0 rounded-2xl bg-slate-100 p-2.5 text-blue-600" : "shrink-0 rounded-2xl bg-white/10 p-2.5 text-white"}>
        {icon}
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const { isLoaded, user } = useUser();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const role = user?.publicMetadata?.role as string | undefined;
  const canCreateVehicle = isLoaded && (role === "Admin" || role === "FleetManager");

  async function load() {
    const response = await fetch("/api/vehicles");
    setVehicles(await response.json());
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter((vehicle) => vehicle.status === "Available").length;
  const onTripVehicles = vehicles.filter((vehicle) => vehicle.status === "OnTrip").length;
  const inShopVehicles = vehicles.filter((vehicle) => vehicle.status === "InShop").length;

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(241,245,249,0.98))] p-5 text-slate-950 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Fleet Overview</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Vehicles</h1>
          <p className="mt-2 text-sm text-slate-500">Manage and track your entire fleet.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-full min-w-[240px] max-w-sm items-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-slate-400 shadow-sm sm:w-auto">
            <Search className="h-4 w-4" />
            <span className="text-sm">Search vehicles...</span>
          </div>
          <button className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          {canCreateVehicle ? <VehicleFormDialog onCreated={load} /> : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        <SummaryCard label="Total Fleet" value={totalVehicles} icon={<Truck className="h-5 w-5" />} />
        <SummaryCard label="Available" value={availableVehicles} icon={<ShieldCheck className="h-5 w-5" />} />
        <SummaryCard label="On Trip" value={onTripVehicles} icon={<Route className="h-5 w-5" />} />
        <SummaryCard label="In Shop" value={inShopVehicles} icon={<Wrench className="h-5 w-5" />} tone="blue" />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/90 text-left text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            <tr>
              <th className="px-4 py-3 sm:px-6">Reg. No.</th>
              <th>Name/Model</th>
              <th>Type</th>
              <th>Load</th>
              <th>Odometer</th>
              <th>Region</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="transition-colors hover:bg-slate-50/80">
                <td className="px-4 py-4 font-semibold text-slate-950 sm:px-6">{vehicle.registrationNumber}</td>
                <td className="py-4 text-slate-700">{vehicle.nameModel}</td>
                <td className="py-4 text-slate-700">{vehicle.type}</td>
                <td className="py-4 text-slate-700">{vehicle.maxLoadCapacity} kg</td>
                <td className="py-4 text-slate-700">{vehicle.odometer} km</td>
                <td className="py-4 text-slate-700">{vehicle.region ?? "—"}</td>
                <td className="py-4"><StatusBadge status={vehicle.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}