"use client";

import { useEffect, useState } from "react";
import { downloadCsv } from "@/lib/csv";

type ReportRow = {
  vehicleId: number;
  registrationNumber: string;
  fuelEfficiency: number;
  operationalCost: number;
  totalDistance: number;
  roi: number;
};

export default function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);

  useEffect(() => {
    fetch("/api/reports").then((response) => response.json()).then(setRows);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Reports</h1>
        <button
          type="button"
          onClick={() => downloadCsv("transitops-report.csv", rows)}
          className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          Export CSV
        </button>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th>Fuel Efficiency</th>
              <th>Operational Cost</th>
              <th>Distance</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.vehicleId} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{row.registrationNumber}</td>
                <td>{row.fuelEfficiency}</td>
                <td>{row.operationalCost}</td>
                <td>{row.totalDistance}</td>
                <td>{row.roi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}