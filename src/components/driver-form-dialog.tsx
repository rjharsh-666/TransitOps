"use client";

import { FormDialog } from "@/components/form-dialog";

export function DriverFormDialog({ onCreated }: { onCreated: () => Promise<void> | void }) {
  return (
    <FormDialog
      triggerLabel="New Driver"
      title="Add Driver"
      description="Register a driver in the roster."
      onSubmit={async (formData) => {
        const payload = Object.fromEntries(formData.entries());
        const response = await fetch("/api/drivers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error((await response.json()).error ?? "Failed to create driver");
        await onCreated();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" placeholder="Name" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="licenseNumber" placeholder="License No." className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="licenseCategory" placeholder="Category" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="licenseExpiryDate" type="date" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="contactNumber" placeholder="Contact" className="rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="userId" placeholder="Clerk User ID (optional)" className="rounded-xl border border-slate-200 px-3 py-2" />
      </div>
    </FormDialog>
  );
}