"use client";

import { useEffect, useState } from "react";
import { FuelLogFormDialog } from "@/components/fuel-log-form-dialog";

type FuelLog = {
  id: number;
  liters: string;
  cost: string;
  logDate: string;
  vehicle: { registrationNumber: string };
};

export default function FuelsPage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);

  async function load() {
    const fuelResponse = await fetch("/api/fuel-logs");
    setFuelLogs(await fuelResponse.json());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Fuel Logs</h1>
          <FuelLogFormDialog onCreated={load} />
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Vehicle</th>
                <th>Liters</th>
                <th>Cost</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.map((log) => (
                <tr key={log.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium">{log.vehicle?.registrationNumber ?? "—"}</td>
                  <td>{log.liters}</td>
                  <td>{log.cost}</td>
                  <td>{new Date(log.logDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
