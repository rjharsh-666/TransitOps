"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { MaintenanceFormDialog } from "@/components/maintenance-form-dialog";

type Log = {
  id: number;
  maintenanceType: string;
  cost: string;
  status: string;
  startDate: string;
  vehicle: { registrationNumber: string };
};

export default function MaintenancePage() {
  const [logs, setLogs] = useState<Log[]>([]);

  async function load() {
    const response = await fetch("/api/maintenance");
    setLogs(await response.json());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Maintenance</h1>
        <MaintenanceFormDialog onCreated={load} />
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th>Type</th>
              <th>Cost</th>
              <th>Started</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{log.vehicle?.registrationNumber ?? "—"}</td>
                <td>{log.maintenanceType}</td>
                <td>{log.cost}</td>
                <td>{new Date(log.startDate).toLocaleDateString()}</td>
                <td><StatusBadge status={log.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}