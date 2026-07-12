"use client";

import { useEffect, useState } from "react";
import { FormDialog, FieldLabel, FieldInput, FieldSelect, FieldTextarea } from "@/components/form-dialog";
import { IndianRupee } from "lucide-react";

type Vehicle = { id: number; registrationNumber: string; nameModel: string };

export function ExpenseFormDialog({ onCreated }: { onCreated: () => Promise<void> | void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setVehicles(data); })
      .catch(() => {});
  }, []);

  return (
    <FormDialog
      triggerLabel="New Expense"
      triggerIcon={<IndianRupee className="h-4 w-4" />}
      title="Record Expense"
      description="Track a non-fuel operating expense for a vehicle or trip."
      submitLabel="Save Expense"
      onSubmit={async (formData) => {
        const payload = Object.fromEntries(formData.entries());
        const response = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error((await response.json()).error ?? "Failed to create expense");
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
          <FieldLabel>Expense Type</FieldLabel>
          <FieldSelect name="expenseType" required>
            <option value="">Select type…</option>
            <option>Toll</option>
            <option>Parking</option>
            <option>Driver Allowance</option>
            <option>Insurance</option>
            <option>Permit / Tax</option>
            <option>Repairs</option>
            <option>Other</option>
          </FieldSelect>
        </div>

        <div>
          <FieldLabel>Amount (₹)</FieldLabel>
          <FieldInput name="amount" type="number" step="0.01" min="0" placeholder="e.g. 850" required />
        </div>

        <div>
          <FieldLabel>Expense Date</FieldLabel>
          <FieldInput name="expenseDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>

        <div>
          <FieldLabel>Trip ID (optional)</FieldLabel>
          <FieldInput name="tripId" type="number" min="1" placeholder="Link to a specific trip" />
        </div>

        <div className="sm:col-span-2">
          <FieldLabel>Description (optional)</FieldLabel>
          <FieldTextarea name="description" placeholder="Add any additional notes…" rows={3} />
        </div>
      </div>
    </FormDialog>
  );
}