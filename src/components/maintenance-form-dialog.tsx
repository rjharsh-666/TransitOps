"use client";

import { useEffect, useState } from "react";
import { FormDialog, FieldLabel, FieldInput, FieldSelect, FieldTextarea } from "@/components/form-dialog";
import { Plus } from "lucide-react";

type Vehicle = { id: number; registrationNumber: string; nameModel: string; status: string };

export function MaintenanceFormDialog({ onCreated }: { onCreated: () => Promise<void> | void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setVehicles(data); })
      .catch(() => {});
  }, []);

  return (
    <FormDialog
      triggerLabel="New Maintenance"
      triggerIcon={<Plus className="h-4 w-4" />}
      title="Open Maintenance Record"
      description="Log a repair or scheduled service and mark the vehicle as In Shop."
      submitLabel="Open Record"
      onSubmit={async (formData) => {
        const payload = Object.fromEntries(formData.entries());
        const response = await fetch("/api/maintenance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error((await response.json()).error ?? "Failed to create maintenance log");
        await onCreated();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel>Vehicle</FieldLabel>
          <FieldSelect name="vehicleId" required>
            <option value="">Select a vehicle…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registrationNumber} — {v.nameModel} ({v.status})
              </option>
            ))}
          </FieldSelect>
        </div>

        <div>
          <FieldLabel>Maintenance Type</FieldLabel>
          <FieldSelect name="maintenanceType" required>
            <option value="">Select type…</option>
            <option>Oil & Filter Change</option>
            <option>Brake Inspection</option>
            <option>Tyre Rotation</option>
            <option>Suspension Repair</option>
            <option>Engine Overhaul</option>
            <option>Electrical Repair</option>
            <option>Bodywork</option>
            <option>Scheduled Service</option>
            <option>Other</option>
          </FieldSelect>
        </div>

        <div>
          <FieldLabel>Start Date</FieldLabel>
          <FieldInput name="startDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>

        <div>
          <FieldLabel>Estimated Cost (₹)</FieldLabel>
          <FieldInput name="cost" type="number" step="0.01" min="0" placeholder="e.g. 5000" required />
        </div>

        <div className="sm:col-span-2">
          <FieldLabel>Description (optional)</FieldLabel>
          <FieldTextarea name="description" placeholder="Describe the issue or service required…" rows={3} />
        </div>
      </div>
    </FormDialog>
  );
}