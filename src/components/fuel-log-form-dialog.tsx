"use client";

import { FormDialog } from "@/components/form-dialog";

export function FuelLogFormDialog({ onCreated }: { onCreated: () => Promise<void> | void }) {
  return (
    <FormDialog
      triggerLabel="New Fuel Log"
      title="Record Fuel Log"
      description="Log refueling for a vehicle."
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
        <input name="vehicleId" type="number" placeholder="Vehicle ID" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="tripId" type="number" placeholder="Trip ID (optional)" className="rounded-xl border border-slate-200 px-3 py-2" />
        <input name="liters" type="number" step="0.01" placeholder="Liters" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="cost" type="number" step="0.01" placeholder="Cost (₹)" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="logDate" type="date" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="odometerReading" type="number" step="0.01" placeholder="Odometer reading (km)" className="rounded-xl border border-slate-200 px-3 py-2" />
      </div>
    </FormDialog>
  );
}