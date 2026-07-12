"use client";

import { FormDialog } from "@/components/form-dialog";

export function VehicleFormDialog({ onCreated }: { onCreated: () => Promise<void> | void }) {
  return (
    <FormDialog
      triggerLabel="New Vehicle"
      title="Register Vehicle"
      description="Add a vehicle to the registry."
      onSubmit={async (formData) => {
        const payload = Object.fromEntries(formData.entries());
        const response = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error((await response.json()).error ?? "Failed to create vehicle");
        await onCreated();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="registrationNumber" placeholder="Registration No." className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="nameModel" placeholder="Name / Model" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="type" placeholder="Type" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="region" placeholder="Region" className="rounded-xl border border-slate-200 px-3 py-2" />
        <input name="maxLoadCapacity" type="number" step="0.01" placeholder="Max Load" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="acquisitionCost" type="number" step="0.01" placeholder="Acquisition Cost" className="rounded-xl border border-slate-200 px-3 py-2" required />
      </div>
    </FormDialog>
  );
}