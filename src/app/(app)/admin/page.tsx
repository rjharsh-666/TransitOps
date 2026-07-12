"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Role } from "@/lib/rbac";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

const ROLES: Role[] = ["Admin", "FleetManager", "Driver", "SafetyOfficer", "FinancialAnalyst"];

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function loadUsers() {
    setLoading(true);
    const response = await fetch("/api/admin/users");
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? "Failed to load users");
      setLoading(false);
      return;
    }
    setUsers(payload);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
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
    await loadUsers();
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
    await loadUsers();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Administration</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">User Roles</h1>
          <p className="mt-2 text-sm text-slate-500">Use this page to sync Clerk users and assign page access roles.</p>
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

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th>Email</th>
              <th>Clerk User ID</th>
              <th>Role</th>
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
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
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