"use client";

import { useEffect, useState } from "react";
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

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);

  async function load() {
    const response = await fetch("/api/trips");
    setTrips(await response.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function transition(id: number, action: "dispatch" | "complete" | "cancel") {
    const response = await fetch(`/api/trips/${id}/${action}`, { method: "POST" });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? `Failed to ${action} trip`);
    }
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Trips</h1>
        <TripFormDialog onCreated={load} />
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Route</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Cargo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{trip.source} → {trip.destination}</td>
                <td>{trip.vehicle?.registrationNumber ?? "—"}</td>
                <td>{trip.driver?.name ?? "—"}</td>
                <td>{trip.cargoWeight}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={trip.status} />
                    {trip.status === "Draft" ? (
                      <button type="button" onClick={() => transition(trip.id, "dispatch")} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                        Dispatch
                      </button>
                    ) : null}
                    {trip.status === "Dispatched" ? (
                      <TripCompleteDialog tripId={trip.id} onCompleted={load} />
                    ) : null}
                    {trip.status === "Dispatched" ? (
                      <button type="button" onClick={() => transition(trip.id, "cancel")} className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700">
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