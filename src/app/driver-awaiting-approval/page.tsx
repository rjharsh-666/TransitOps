"use client";

import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

type DriverApplication = {
  status: "Pending" | "Approved" | "Denied";
  licenseNumber: string;
  licenseCategory: string;
  yearsExperience: number;
  hasHeavyVehiclePermit: boolean;
  reviewNotes: string | null;
  reviewedAt: string | null;
};

export default function DriverAwaitingApprovalPage() {
  const [application, setApplication] = useState<DriverApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const { signOut } = useClerk();

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/driver-applications/mine");
      const payload = await response.json();
      if (response.ok && payload) {
        if (payload.status === "Approved") {
          window.location.href = "/dashboard";
          return;
        }
        setApplication(payload);
      }
      setLoading(false);
    }

    void load();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.1),_transparent_45%),linear-gradient(180deg,_#f8fafc,_#eef2ff)] px-6">
      <section className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/70">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">TransitOps</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Driver application received</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Your account is pending approval. The fleet team will review your license and experience details before activating driver access.</p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {loading ? (
            <p>Loading your application...</p>
          ) : application ? (
            <div className="space-y-2">
              <p><span className="font-medium text-slate-900">Status:</span> {application.status}</p>
              <p><span className="font-medium text-slate-900">License:</span> {application.licenseNumber}</p>
              <p><span className="font-medium text-slate-900">Category:</span> {application.licenseCategory}</p>
              <p><span className="font-medium text-slate-900">Experience:</span> {application.yearsExperience} years</p>
              <p><span className="font-medium text-slate-900">Heavy vehicle permit:</span> {application.hasHeavyVehiclePermit ? "Yes" : "No"}</p>
              {application.reviewNotes ? <p><span className="font-medium text-slate-900">Review note:</span> {application.reviewNotes}</p> : null}
            </div>
          ) : (
            <p>No driver application was found yet. Refresh after sign-up or contact admin if this looks wrong.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => signOut({ redirectUrl: "/" })}>
            Sign out
          </Button>
        </div>
      </section>
    </main>
  );
}