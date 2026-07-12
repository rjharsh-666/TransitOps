"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { DriverFormDialog } from "@/components/driver-form-dialog";

type Driver = {
  id: number;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  status: string;
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);

  async function load() {
    const response = await fetch("/api/drivers");
    setDrivers(await response.json());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Drivers</h1>
        <DriverFormDialog onCreated={load} />
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th>License No.</th>
              <th>Category</th>
              <th>Expires</th>
              <th>Contact</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{driver.name}</td>
                <td>{driver.licenseNumber}</td>
                <td>{driver.licenseCategory}</td>
                <td>{new Date(driver.licenseExpiryDate).toLocaleDateString()}</td>
                <td>{driver.contactNumber}</td>
                <td><StatusBadge status={driver.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}