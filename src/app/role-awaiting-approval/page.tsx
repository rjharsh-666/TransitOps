"use client";

import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type RoleRequest = {
  status: "Pending" | "Approved" | "Denied";
  requestedRole: string;
  approvedRole: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
};

export default function RoleAwaitingApprovalPage() {
  const [request, setRequest] = useState<RoleRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/role-requests/mine");
      const payload = await response.json();
      if (response.ok && payload) {
        if (payload.status === "Approved") {
          window.location.href = "/dashboard";
          return;
        }
        setRequest(payload);
      }
      setLoading(false);
    }

    void load();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.1),_transparent_45%),linear-gradient(180deg,_#f8fafc,_#eef2ff)] px-6">
      <section className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/70">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">TransitOps</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Awaiting role approval</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Your account is pending role assignment. An administrator will review your requested role and grant you access.</p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {loading ? (
            <p>Loading request details...</p>
          ) : request ? (
            <div className="space-y-2">
              <p><span className="font-medium text-slate-900">Status:</span> {request.status}</p>
              <p><span className="font-medium text-slate-900">Requested role:</span> {request.requestedRole}</p>
              {request.reviewNotes ? <p><span className="font-medium text-slate-900">Review note:</span> {request.reviewNotes}</p> : null}
            </div>
          ) : (
            <p>No role request was found. You might need to submit one first.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {!loading && (!request || request.status === "Denied") && (
            <Button variant="outline" onClick={() => router.push("/role-request")}>
              Submit New Request
            </Button>
          )}
          <Button variant="outline" onClick={() => signOut({ redirectUrl: "/" })}>
            Sign out
          </Button>
        </div>
      </section>
    </main>
  );
}
