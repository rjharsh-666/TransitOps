"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { DriverFormDialog } from "@/components/driver-form-dialog";
import { KpiCard } from "@/components/kpi-card";
import { AlertCircle, Search, X } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");

  async function load() {
    const response = await fetch("/api/drivers");
    setDrivers(await response.json());
  }

  useEffect(() => {
    load();
  }, []);

  const filteredDrivers = drivers.filter((driver) =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalActive = drivers.filter((d) => d.status === "Available").length;
  const onTrip = drivers.filter((d) => d.status === "OnTrip").length;
  const expiringDocs = drivers.filter((d) => {
    const expiryDate = new Date(d.licenseExpiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
  }).length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Driver Management</h1>
          <p className="mt-1 text-sm text-slate-600">Monitor driver status, safety scores, and credential compliance.</p>
        </div>
        <DriverFormDialog onCreated={load} />
      </div>

      {/* Compliance Warning Banner */}
      {expiringDocs > 0 && (
        <div className="flex gap-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Action Required: Compliance Warnings</h3>
            <p className="text-sm text-red-800">
              {expiringDocs} driver{expiringDocs !== 1 ? "s" : ""} {expiringDocs !== 1 ? "have" : "has"} licenses expiring within the next 30 days. 1 driver requires immediate medical certification renewal.
            </p>
          </div>
          <button className="whitespace-nowrap text-sm font-semibold text-red-600 hover:text-red-700">
            View All
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="TOTAL ACTIVE" value={totalActive} />
        <KpiCard label="ON TRIP" value={onTrip} />
        <KpiCard label="AVG SAFETY SCORE" value="92.4" suffix=" /100" />
        <KpiCard label="EXPIRING DOCS" value={expiringDocs} suffix={expiringDocs > 0 ? " Within 30d" : ""} />
      </div>

      {/* Search Bar */}
      <div className="relative flex h-11 w-full max-w-md items-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-slate-400 shadow-sm">
        <Search className="h-4 w-4 shrink-0" />
        <input
          type="text"
          placeholder="Search drivers, licenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border-0 bg-transparent text-sm text-slate-950 placeholder:text-slate-400 outline-none"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className="shrink-0 text-slate-400 hover:text-slate-700">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Driver Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDrivers.map((driver) => {
          const daysUntilExpiry = getDaysUntilExpiry(driver.licenseExpiryDate);
          const isExpiringSoon = daysUntilExpiry <= 30;

          return (
            <div
              key={driver.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card Header with Status */}
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
                      {getInitials(driver.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-950">{driver.name}</h3>
                      <p className="text-xs text-slate-600">ID: {driver.licenseNumber}</p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">⋯</button>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 py-4 space-y-4">
                {/* Status Badge */}
                <div>
                  <StatusBadge status={driver.status} />
                </div>

                {/* License & Contact Info */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">License Class</p>
                      <p className="mt-1 font-semibold text-slate-950">{driver.licenseCategory}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Contact</p>
                      <p className="mt-1 font-semibold text-slate-950">{driver.contactNumber}</p>
                    </div>
                  </div>

                  {/* License Expiry */}
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">License Expiry</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="font-semibold text-slate-950">
                        {new Date(driver.licenseExpiryDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                        })}
                      </p>
                      {isExpiringSoon && (
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            daysUntilExpiry <= 0
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {daysUntilExpiry <= 0 ? "Expired" : `${daysUntilExpiry}d left`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-3">
                <p className="text-xs text-slate-600">Base: Terminal A</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredDrivers.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
          <p className="text-slate-600">
            {searchTerm ? "No drivers match your search" : "No drivers yet. Create your first driver to get started."}
          </p>
        </div>
      )}
    </div>
  );
}