"use client";

import { FormDialog } from "@/components/form-dialog";

export function MaintenanceFormDialog({ onCreated }: { onCreated: () => Promise<void> | void }) {
  return (
    <FormDialog
      triggerLabel="New Maintenance"
      title="Open Maintenance Record"
      description="Mark a vehicle as in shop and record the work."
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
        <input name="vehicleId" type="number" placeholder="Vehicle ID" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="maintenanceType" placeholder="Type" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="startDate" type="date" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="cost" type="number" step="0.01" placeholder="Cost" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <textarea name="description" placeholder="Description" className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2" rows={3} />
      </div>
    </FormDialog>
  );
}