"use client";

import { FormDialog } from "@/components/form-dialog";

export function TripFormDialog({ onCreated }: { onCreated: () => Promise<void> | void }) {
  return (
    <FormDialog
      triggerLabel="New Trip"
      title="Create Trip"
      description="Draft a trip before dispatch."
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
        <input name="source" placeholder="Source" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="destination" placeholder="Destination" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="vehicleId" type="number" placeholder="Vehicle ID" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="driverId" type="number" placeholder="Driver ID" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="cargoWeight" type="number" step="0.01" placeholder="Cargo weight" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="plannedDistance" type="number" step="0.01" placeholder="Planned distance (km)" className="rounded-xl border border-slate-200 px-3 py-2" required />
      </div>
    </FormDialog>
  );
}