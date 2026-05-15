"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Row = {
  _id: string;
  month: string;
  amount: number;
  status: string;
  tenantId?: { name?: string };
};

export default function PaymentsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<Row[]>("/api/payments/history")
      .then(setRows)
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Payment history</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Monthly records when you mark tenants paid or pending.</p>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/80">
            <tr>
              <th className="px-4 py-3 font-medium">Month</th>
              <th className="px-4 py-3 font-medium">Tenant</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3">{r.month}</td>
                <td className="px-4 py-3">{r.tenantId?.name || "—"}</td>
                <td className="px-4 py-3">₹{r.amount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 capitalize">{r.status}</td>
              </tr>
            ))}
            {rows.length === 0 && !err && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  No payment rows yet. Mark a tenant as paid to create history.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
