"use client";

import { FormDialog } from "@/components/form-dialog";

export function ExpenseFormDialog({ onCreated }: { onCreated: () => Promise<void> | void }) {
  return (
    <FormDialog
      triggerLabel="New Expense"
      title="Record Expense"
      description="Track a non-fuel operating expense."
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
        <input name="vehicleId" type="number" placeholder="Vehicle ID" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="tripId" type="number" placeholder="Trip ID (optional)" className="rounded-xl border border-slate-200 px-3 py-2" />
        <input name="expenseType" placeholder="Expense type" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="amount" type="number" step="0.01" placeholder="Amount (₹)" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="expenseDate" type="date" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <textarea name="description" placeholder="Description" className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2" rows={3} />
      </div>
    </FormDialog>
  );
}