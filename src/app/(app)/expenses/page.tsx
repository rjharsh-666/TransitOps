"use client";

import { useEffect, useState } from "react";
import { Search, Download, IndianRupee, TrendingUp, Activity, CheckCircle } from "lucide-react";
import { ExpenseFormDialog } from "@/components/expense-form-dialog";

type Expense = {
  id: number;
  expenseType: string;
  amount: string;
  expenseDate: string;
  vehicle: { registrationNumber: string };
};

type FinancialMetrics = {
  totalOperatingCost: number;
  fleetROI: number;
  costPerKm: number;
  budgetAdherence: number;
  costTrend: number;
  roiTrend: number;
  costPerKmTrend: number;
};

function MetricCard({
  label,
  value,
  suffix = "",
  icon,
  trend,
  trendLabel,
  status,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  status?: string;
}) {
  const isTrendPositive = (trend ?? 0) > 0;
  const trendColor = trend === undefined ? "" : isTrendPositive ? "text-emerald-600" : "text-rose-600";
  const trendBgColor = trend === undefined ? "" : isTrendPositive ? "bg-emerald-50" : "bg-rose-50";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.45)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <div className="mt-3 flex items-end gap-2">
            <p className="text-2xl font-bold tracking-tight text-slate-950 xl:text-3xl">
              {value}
              {suffix && <span className="text-lg text-slate-500 ml-1">{suffix}</span>}
            </p>
          </div>
          {trend !== undefined && (
            <p className={`mt-2 text-xs font-semibold ${trendColor}`}>
              {isTrendPositive ? "↑" : "↓"} {Math.abs(trend)}% {trendLabel || "vs last quarter"}
            </p>
          )}
          {status && (
            <p className="mt-2 text-xs font-semibold text-slate-600">{status}</p>
          )}
        </div>
        <div className="shrink-0 rounded-2xl bg-slate-100 p-2.5 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ExpenseCategoryItem({
  category,
  amount,
  percentage,
  color,
}: {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${color}`}></div>
        <span className="text-sm font-medium text-slate-700">{category}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-slate-950">₹{amount.toLocaleString()}</p>
        <p className="text-xs text-slate-500">{percentage}% of total</p>
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalOperatingCost: 142850,
    fleetROI: 24.8,
    costPerKm: 1.48,
    budgetAdherence: 92,
    costTrend: 12.5,
    roiTrend: 2.4,
    costPerKmTrend: -5.1,
  });

  async function load() {
    const expenseResponse = await fetch("/api/expenses");
    const expenseData = await expenseResponse.json();
    setExpenses(expenseData);

    // Calculate metrics from expenses
    if (Array.isArray(expenseData) && expenseData.length > 0) {
      const totalCost = expenseData.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
      setMetrics((prev) => ({
        ...prev,
        totalOperatingCost: totalCost,
      }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Group expenses by type
  const expensesByType = expenses.reduce(
    (acc, exp) => {
      const type = exp.expenseType || "Other";
      if (!acc[type]) acc[type] = 0;
      acc[type] += parseFloat(exp.amount || 0);
      return acc;
    },
    {} as Record<string, number>
  );

  const totalExpenses = Object.values(expensesByType).reduce((a, b) => a + b, 0);
  const expenseCategories = [
    { category: "Fuel", amount: Math.round(totalExpenses * 0.42), percentage: 42, color: "bg-blue-600" },
    { category: "Maintenance", amount: Math.round(totalExpenses * 0.25), percentage: 25, color: "bg-orange-500" },
    { category: "Insurance", amount: Math.round(totalExpenses * 0.20), percentage: 20, color: "bg-slate-600" },
    { category: "Driver Pay", amount: Math.round(totalExpenses * 0.13), percentage: 13, color: "bg-slate-300" },
  ];

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(241,245,249,0.98))] p-5 text-slate-950 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.45)]">
      {/* Header Section */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Financial Analytics</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Financial Analytics</h1>
          <p className="mt-2 text-sm text-slate-500">Comprehensive overview of fleet operational costs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Export Financial Report
          </button>
          <ExpenseFormDialog onCreated={load} />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Operating Cost"
          value={`₹${(metrics.totalOperatingCost / 1000).toFixed(0)}k`}
          icon={<IndianRupee className="h-5 w-5" />}
          trend={metrics.costTrend}
          trendLabel="vs Last Quarter"
        />
        <MetricCard
          label="Fleet ROI"
          value={metrics.fleetROI}
          suffix="%"
          icon={<TrendingUp className="h-5 w-5" />}
          trend={metrics.roiTrend}
          trendLabel="Annual average"
        />
        <MetricCard
          label="Cost Per Km"
          value={`₹${metrics.costPerKm}`}
          icon={<Activity className="h-5 w-5" />}
          trend={metrics.costPerKmTrend}
          trendLabel="Target: ₹1.42"
        />
        <MetricCard
          label="Budget Adherence"
          value={metrics.budgetAdherence}
          suffix="%"
          icon={<CheckCircle className="h-5 w-5" />}
          status="₹16k remaining"
        />
      </div>

      {/* Charts and Breakdown Section */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Monthly Spending Analysis */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Monthly Spending Analysis</h2>
              <p className="mt-1 text-sm text-slate-500">Tracking costs across fiscal year</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200">
                12M
              </button>
              <button className="px-3 py-1 rounded-full text-xs font-semibold hover:bg-slate-100 text-slate-600">
                6M
              </button>
              <button className="px-3 py-1 rounded-full text-xs font-semibold hover:bg-slate-100 text-slate-600">
                3M
              </button>
            </div>
          </div>
          <div className="mt-8 h-64 flex items-end justify-between gap-3 px-4">
            {["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG"].map((month, idx) => (
              <div key={month} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 shadow-lg"
                  style={{ height: `${Math.random() * 180 + 60}px` }}
                ></div>
                <span className="text-xs font-semibold text-slate-500">{month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">Category Breakdown</h2>
          <p className="mt-1 text-sm text-slate-500">Top expense categories</p>
          <div className="mt-6 space-y-1">
            {expenseCategories.map((cat) => (
              <ExpenseCategoryItem key={cat.category} {...cat} />
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-950">Recent Expenses</h3>
          <div className="flex items-center gap-2">
            <div className="flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white/50 px-3 text-slate-400 shadow-sm">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-slate-950 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.5)]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 text-left text-slate-500 border-b border-slate-200/50">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No expenses recorded yet. Add your first expense to get started.
                  </td>
                </tr>
              ) : (
                expenses.slice(0, 10).map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-medium text-slate-950">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-slate-950">{expense.vehicle?.registrationNumber ?? "—"}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700">
                        {expense.expenseType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-950">₹{expense.amount}</td>
                    <td className="px-6 py-4 text-emerald-600 font-semibold">
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700">
                        Recorded
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
