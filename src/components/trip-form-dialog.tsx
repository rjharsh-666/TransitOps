"use client";

import { useEffect, useState } from "react";
import { FormDialog, FieldLabel, FieldInput, FieldSelect } from "@/components/form-dialog";
import { Plus } from "lucide-react";

type Vehicle = { id: number; registrationNumber: string; nameModel: string };
type Driver = { id: number; name: string; status: string };

export function TripFormDialog({ onCreated }: { onCreated: () => Promise<void> | void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    Promise.all([fetch("/api/vehicles"), fetch("/api/drivers")])
      .then(async ([vRes, dRes]) => {
        const [vData, dData] = await Promise.all([vRes.json(), dRes.json()]);
        if (Array.isArray(vData)) setVehicles(vData.filter((v: any) => v.status === "Available"));
        if (Array.isArray(dData)) setDrivers(dData.filter((d: any) => d.status === "Available"));
      })
      .catch(() => {});
  }, []);

  return (
    <FormDialog
      triggerLabel="New Trip"
      triggerIcon={<Plus className="h-4 w-4" />}
      title="Create Trip"
      description="Draft a new trip and assign an available vehicle and driver."
      submitLabel="Create Trip"
      onSubmit={async (formData) => {
        const payload = Object.fromEntries(formData.entries());
        const response = await fetch("/api/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error((await response.json()).error ?? "Failed to create trip");
        await onCreated();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Origin (Source)</FieldLabel>
          <FieldInput name="source" placeholder="e.g. Mumbai" required />
        </div>

        <div>
          <FieldLabel>Destination</FieldLabel>
          <FieldInput name="destination" placeholder="e.g. Pune" required />
        </div>

        <div>
          <FieldLabel>Vehicle (Available)</FieldLabel>
          <FieldSelect name="vehicleId" required>
            <option value="">Select vehicle…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registrationNumber} — {v.nameModel}
              </option>
            ))}
            {vehicles.length === 0 && <option disabled>No available vehicles</option>}
          </FieldSelect>
        </div>

        <div>
          <FieldLabel>Driver (Available)</FieldLabel>
          <FieldSelect name="driverId" required>
            <option value="">Select driver…</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
            {drivers.length === 0 && <option disabled>No available drivers</option>}
          </FieldSelect>
        </div>

        <div>
          <FieldLabel>Cargo Weight (kg)</FieldLabel>
          <FieldInput name="cargoWeight" type="number" step="0.01" min="0" placeholder="e.g. 1200" required />
        </div>

        <div>
          <FieldLabel>Planned Distance (km)</FieldLabel>
          <FieldInput name="plannedDistance" type="number" step="0.01" min="0" placeholder="e.g. 350" required />
        </div>
      </div>
    </FormDialog>
  );
}