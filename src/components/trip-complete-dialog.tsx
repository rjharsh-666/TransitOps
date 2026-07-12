"use client";

import { FormDialog } from "@/components/form-dialog";

export function TripCompleteDialog({ tripId, onCompleted }: { tripId: number; onCompleted: () => Promise<void> | void }) {
  return (
    <FormDialog
      triggerLabel="Complete"
      title={`Complete Trip #${tripId}`}
      description="Record the closing distance and fuel consumption."
      submitLabel="Complete"
      onSubmit={async (formData) => {
        const payload = Object.fromEntries(formData.entries());
        const response = await fetch(`/api/trips/${tripId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error((await response.json()).error ?? "Failed to complete trip");
        await onCompleted();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="actualDistance" type="number" step="0.01" placeholder="Actual distance (km)" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="fuelConsumed" type="number" step="0.01" placeholder="Fuel consumed (L)" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="odometerReading" type="number" step="0.01" placeholder="Odometer reading (km)" className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2" />
      </div>
    </FormDialog>
  );
}