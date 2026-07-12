"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Role } from "@/lib/rbac";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  signupType: string | null;
  signupStatus: "Pending" | "Approved" | "Denied";
  requestedRole: string | null;
  createdAt: string;
  updatedAt: string;
};

type DriverApplication = {
  id: number;
  status: "Pending" | "Approved" | "Denied";
  hasHeavyVehiclePermit: boolean;
  yearsExperience: number;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  reviewNotes: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    signupType: string | null;
    signupStatus: string;
  };
};

type RoleRequest = {
  id: number;
  status: "Pending" | "Approved" | "Denied";
  requestedRole: string;
  approvedRole: string | null;
  reviewNotes: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    signupType: string | null;
    signupStatus: string;
  };
};

const ROLES: Role[] = ["Pending", "Admin", "FleetManager", "Driver", "SafetyOfficer", "FinancialAnalyst"];
const FINAL_ROLES: Exclude<Role, "Pending">[] = ["Admin", "FleetManager", "Driver", "SafetyOfficer", "FinancialAnalyst"];

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [driverApplications, setDriverApplications] = useState<DriverApplication[]>([]);
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Record<number, Exclude<Role, "Pending">>>({});

  async function loadData() {
    setLoading(true);
    const [usersResponse, applicationsResponse, requestsResponse] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/driver-applications"),
      fetch("/api/admin/role-requests"),
    ]);

    const [usersPayload, applicationsPayload, requestsPayload] = await Promise.all([
      usersResponse.json(),
      applicationsResponse.json(),
      requestsResponse.json(),
    ]);

    if (!usersResponse.ok) {
      toast.error(usersPayload.error ?? "Failed to load users");
      setLoading(false);
      return;
    }

    if (!applicationsResponse.ok) {
      toast.error(applicationsPayload.error ?? "Failed to load driver applications");
      setLoading(false);
      return;
    }

    if (!requestsResponse.ok) {
      toast.error(requestsPayload.error ?? "Failed to load role requests");
      setLoading(false);
      return;
    }

    setUsers(usersPayload);
    setDriverApplications(applicationsPayload);
    setRoleRequests(requestsPayload);
    setSelectedRoles(
      Object.fromEntries(
        requestsPayload.map((request: RoleRequest) => [request.id, (FINAL_ROLES.includes(request.requestedRole as Exclude<Role, "Pending">) ? request.requestedRole : "FleetManager") as Exclude<Role, "Pending">])
      )
    );
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function syncFromClerk() {
    setSyncing(true);
    const response = await fetch("/api/admin/sync", { method: "POST" });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? "Failed to sync Clerk users");
      setSyncing(false);
      return;
    }
    toast.success(`Synced ${payload.synced} users from Clerk`);
    await loadData();
    setSyncing(false);
  }

  async function updateRole(userId: string, role: Role) {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? "Failed to update role");
      return;
    }
    toast.success("Role updated");
    await loadData();
  }

  async function reviewDriverApplication(applicationId: number, action: "approve" | "deny") {
    const response = await fetch(`/api/admin/driver-applications/${applicationId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? "Failed to review driver application");
      return;
    }
    toast.success(`Driver application ${payload.status.toLowerCase()}`);
    await loadData();
  }

  async function reviewRoleRequest(requestId: number, action: "approve" | "deny") {
    const response = await fetch(`/api/admin/role-requests/${requestId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, approvedRole: selectedRoles[requestId] }),
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? "Failed to review role request");
      return;
    }
    toast.success(`Role request ${payload.status.toLowerCase()}`);
    await loadData();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Administration</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">User Roles</h1>
          <p className="mt-2 text-sm text-slate-500">Use this page to sync Clerk users, approve driver applications, and review incoming role requests.</p>
        </div>
        <button
          type="button"
          onClick={syncFromClerk}
          disabled={syncing}
          className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
        >
          {syncing ? "Syncing..." : "Sync from Clerk"}
        </button>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Driver approvals</h2>
          <p className="mt-1 text-sm text-slate-500">Review license details and years of experience before activating driver access.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th>Email</th>
                <th>License</th>
                <th>Experience</th>
                <th>Heavy permit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={7}>Loading driver applications...</td></tr>
              ) : driverApplications.length === 0 ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={7}>No driver applications found.</td></tr>
              ) : (
                driverApplications.map((application) => (
                  <tr key={application.id} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-3 font-medium">{application.user.name ?? "—"}</td>
                    <td>{application.user.email}</td>
                    <td>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{application.licenseNumber}</p>
                        <p className="text-xs text-slate-500">{application.licenseCategory} · Expires {new Date(application.licenseExpiryDate).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td>{application.yearsExperience} years</td>
                    <td>{application.hasHeavyVehiclePermit ? "Yes" : "No"}</td>
                    <td>{application.status}</td>
                    <td>
                      {application.status === "Pending" ? (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => reviewDriverApplication(application.id, "approve")} className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500">Approve</button>
                          <button type="button" onClick={() => reviewDriverApplication(application.id, "deny")} className="rounded-full bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-500">Deny</button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Incoming role requests</h2>
          <p className="mt-1 text-sm text-slate-500">Approve, deny, or change the requested role before approval.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th>Email</th>
                <th>Requested role</th>
                <th>Status</th>
                <th>Review role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={6}>Loading role requests...</td></tr>
              ) : roleRequests.length === 0 ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={6}>No role requests found.</td></tr>
              ) : (
                roleRequests.map((request) => (
                  <tr key={request.id} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-3 font-medium">{request.user.name ?? "—"}</td>
                    <td>{request.user.email}</td>
                    <td>{request.requestedRole}</td>
                    <td>{request.status}</td>
                    <td>
                      {request.status === "Pending" ? (
                        <select
                          value={selectedRoles[request.id] ?? "FleetManager"}
                          onChange={(event) => setSelectedRoles((current) => ({ ...current, [request.id]: event.target.value as Exclude<Role, "Pending"> }))}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          {FINAL_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td>
                      {request.status === "Pending" ? (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => reviewRoleRequest(request.id, "approve")} className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500">Approve</button>
                          <button type="button" onClick={() => reviewRoleRequest(request.id, "deny")} className="rounded-full bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-500">Deny</button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th>Email</th>
              <th>Clerk User ID</th>
              <th>Role</th>
              <th>Signup Type</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={7}>
                  No users found. Sync from Clerk to import accounts.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium">{user.name ?? "—"}</td>
                  <td>{user.email}</td>
                  <td className="font-mono text-xs text-slate-600">{user.id}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(event) => updateRole(user.id, event.target.value as Role)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{user.signupType ?? "—"}</td>
                  <td>{user.signupStatus}</td>
                  <td>{new Date(user.updatedAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}