"use client";

import { useEffect, useState } from "react";
import { FormDialog, FieldLabel, FieldInput, FieldSelect } from "@/components/form-dialog";
import { Fuel } from "lucide-react";

type Vehicle = { id: number; registrationNumber: string; nameModel: string };

export function FuelLogFormDialog({ onCreated }: { onCreated: () => Promise<void> | void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setVehicles(data); })
      .catch(() => {});
  }, []);

  return (
    <FormDialog
      triggerLabel="Add Fuel Log"
      triggerIcon={<Fuel className="h-4 w-4" />}
      title="Record Fuel Log"
      description="Log a refueling event for a vehicle."
      submitLabel="Save Log"
      onSubmit={async (formData) => {
        const payload = Object.fromEntries(formData.entries());
        const response = await fetch("/api/fuel-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error((await response.json()).error ?? "Failed to create fuel log");
        await onCreated();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel>Vehicle</FieldLabel>
          <FieldSelect name="vehicleId" required>
            <option value="">Select vehicle…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registrationNumber} — {v.nameModel}
              </option>
            ))}
          </FieldSelect>
        </div>

        <div>
          <FieldLabel>Fuel Volume (Liters)</FieldLabel>
          <FieldInput name="liters" type="number" step="0.01" min="0" placeholder="e.g. 45.5" required />
        </div>

        <div>
          <FieldLabel>Total Cost (₹)</FieldLabel>
          <FieldInput name="cost" type="number" step="0.01" min="0" placeholder="e.g. 4095" required />
        </div>

        <div>
          <FieldLabel>Date of Refuel</FieldLabel>
          <FieldInput name="logDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>

        <div>
          <FieldLabel>Odometer Reading (km)</FieldLabel>
          <FieldInput name="odometerReading" type="number" step="0.01" min="0" placeholder="e.g. 12450" />
        </div>

        <div className="sm:col-span-2">
          <FieldLabel>Trip ID (optional)</FieldLabel>
          <FieldInput name="tripId" type="number" min="1" placeholder="Link to a specific trip" />
        </div>
      </div>
    </FormDialog>
  );
}