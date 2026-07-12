"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FieldProps = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
};

function Field({ name, label, type = "text", placeholder, required = false }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
    </label>
  );
}

export function VehicleCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      const payload = Object.fromEntries(
        Array.from(formData.entries()).map(([key, value]) => [key, value === "" ? undefined : value])
      );
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Failed to create vehicle");
      }

      router.push("/vehicles");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create vehicle");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Fleet Operations</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Register a new vehicle</h2>
        <p className="mt-2 text-sm text-slate-500">Add a vehicle to the live fleet registry and make it available for dispatch planning.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="registrationNumber" label="Registration Number" placeholder="KA01AB1234" required />
        <Field name="nameModel" label="Name / Model" placeholder="Ashok Leyland Boss 1920" required />
        <Field name="type" label="Vehicle Type" placeholder="Truck" required />
        <Field name="region" label="Region" placeholder="South Zone" />
        <Field name="maxLoadCapacity" label="Max Load Capacity" type="number" placeholder="24.5" required />
        <Field name="acquisitionCost" label="Acquisition Cost" type="number" placeholder="2500000" required />
        <Field name="odometer" label="Odometer Reading" type="number" placeholder="0" />
      </div>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-medium text-white shadow-[0_18px_40px_-18px_rgba(37,99,235,0.85)] transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Create Vehicle"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}