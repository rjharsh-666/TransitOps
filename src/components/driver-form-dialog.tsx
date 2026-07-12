"use client";

import { FormDialog, FieldLabel, FieldInput } from "@/components/form-dialog";
import { UserPlus } from "lucide-react";

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-slate-950 focus:bg-white focus:ring-2 focus:ring-slate-950/10";

export function DriverFormDialog({ onCreated }: { onCreated: () => Promise<void> | void }) {
  return (
    <FormDialog
      triggerLabel="New Driver"
      triggerIcon={<UserPlus className="h-4 w-4" />}
      title="Register Driver"
      description="Add a new driver to the fleet roster with their license and contact details."
      submitLabel="Register Driver"
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
        <div className="sm:col-span-2">
          <FieldLabel>Full Name</FieldLabel>
          <FieldInput name="name" placeholder="e.g. Rajesh Kumar" required />
        </div>

        <div>
          <FieldLabel>License Number</FieldLabel>
          <FieldInput name="licenseNumber" placeholder="e.g. MH-12-20180012345" required />
        </div>

        <div>
          <FieldLabel>License Category</FieldLabel>
          <select name="licenseCategory" required className={inputCls}>
            <option value="">Select category…</option>
            <option value="LMV">LMV – Light Motor Vehicle</option>
            <option value="HMV">HMV – Heavy Motor Vehicle</option>
            <option value="MCWG">MCWG – Motorcycle with Gear</option>
            <option value="TRANS">TRANS – Transport</option>
          </select>
        </div>

        <div>
          <FieldLabel>License Expiry Date</FieldLabel>
          <FieldInput name="licenseExpiryDate" type="date" required />
        </div>

        <div>
          <FieldLabel>Contact Number</FieldLabel>
          <FieldInput name="contactNumber" placeholder="e.g. +91 98765 43210" required />
        </div>

        <div>
          <FieldLabel>Years of Experience</FieldLabel>
          <FieldInput name="yearsExperience" type="number" min="0" max="50" placeholder="e.g. 5" />
        </div>

        <div className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input type="checkbox" name="hasHeavyVehiclePermit" value="true" id="hvp-check" className="h-4 w-4 rounded accent-slate-950" />
          <label htmlFor="hvp-check" className="text-sm text-slate-700 cursor-pointer">
            Has Heavy Vehicle Permit (HVP)
          </label>
        </div>
      </div>
    </FormDialog>
  );
}