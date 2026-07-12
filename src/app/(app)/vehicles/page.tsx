"use client";

import { useEffect, useState } from "react";
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

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  async function load() {
    const response = await fetch("/api/vehicles");
    setVehicles(await response.json());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Vehicles</h1>
        <VehicleFormDialog onCreated={load} />
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Reg. No.</th>
              <th>Name/Model</th>
              <th>Type</th>
              <th>Load</th>
              <th>Odometer</th>
              <th>Region</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{vehicle.registrationNumber}</td>
                <td>{vehicle.nameModel}</td>
                <td>{vehicle.type}</td>
                <td>{vehicle.maxLoadCapacity} kg</td>
                <td>{vehicle.odometer} km</td>
                <td>{vehicle.region ?? "—"}</td>
                <td><StatusBadge status={vehicle.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}