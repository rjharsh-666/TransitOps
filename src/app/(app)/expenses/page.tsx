"use client";

import { useEffect, useState } from "react";
import { ExpenseFormDialog } from "@/components/expense-form-dialog";

type Expense = {
  id: number;
  expenseType: string;
  amount: string;
  expenseDate: string;
  vehicle: { registrationNumber: string };
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  async function load() {
    const expenseResponse = await fetch("/api/expenses");
    setExpenses(await expenseResponse.json());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Expenses</h1>
          <ExpenseFormDialog onCreated={load} />
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Vehicle</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium">{expense.vehicle?.registrationNumber ?? "—"}</td>
                  <td>{expense.expenseType}</td>
                  <td>{expense.amount}</td>
                  <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
