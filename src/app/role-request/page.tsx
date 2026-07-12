"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const FINAL_ROLES = ["Admin", "FleetManager", "SafetyOfficer", "FinancialAnalyst"] as const;

type RoleRequest = {
  status: "Pending" | "Approved" | "Denied";
  requestedRole: string;
  approvedRole: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
};

export default function RoleRequestPage() {
  const router = useRouter();
  const [requestedRole, setRequestedRole] = useState<(typeof FINAL_ROLES)[number]>("FleetManager");
  const [notes, setNotes] = useState("");
  const [request, setRequest] = useState<RoleRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/role-requests/mine");
      const payload = await response.json();
      setRequest(response.ok ? payload : null);
      if (response.ok && payload) {
        if (payload.status === "Approved") {
          window.location.href = "/dashboard";
          return;
        } else if (payload.status === "Pending") {
          router.push("/role-awaiting-approval");
          return;
        }
        if (payload.requestedRole && FINAL_ROLES.includes(payload.requestedRole as any)) {
          setRequestedRole(payload.requestedRole as (typeof FINAL_ROLES)[number]);
        }
      }
      setLoading(false);
    }

    void load();
  }, [router]);

  async function submitRequest() {
    setSaving(true);
    try {
      const response = await fetch("/api/role-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestedRole, notes }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to submit request");
      }

      setRequest(payload);
      toast.success("Role request sent");
      router.push("/role-awaiting-approval");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.1),_transparent_45%),linear-gradient(180deg,_#f8fafc,_#eef2ff)] px-6 py-10">
      <section className="w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/70">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">TransitOps</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Request a role assignment</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Other user accounts stay here until an admin reviews the role you want. You can submit a request and the team can approve, deny, or change it before approval.</p>

        <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Desired role
            <select value={requestedRole} onChange={(event) => setRequestedRole(event.target.value as (typeof FINAL_ROLES)[number])} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-slate-950">
              {FINAL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" onClick={submitRequest} disabled={saving} className="rounded-2xl px-6 py-3">
            {saving ? "Sending..." : "Send request"}
          </Button>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            Message to admin
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-950" placeholder="Add a short note about why you need this role" />
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Current request</p>
          {loading ? (
            <p className="mt-2 text-slate-500">Loading...</p>
          ) : request ? (
            <div className="mt-2 space-y-1">
              <p>Status: {request.status}</p>
              <p>Requested role: {request.requestedRole}</p>
              {request.approvedRole ? <p>Approved role: {request.approvedRole}</p> : null}
              {request.reviewNotes ? <p>Review note: {request.reviewNotes}</p> : null}
            </div>
          ) : (
            <p className="mt-2 text-slate-500">No request submitted yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}