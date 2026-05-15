"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Property = {
  _id: string;
  name: string;
  rentAmount: number;
  dueDay: number;
};

export default function PropertiesPage() {
  const [list, setList] = useState<Property[]>([]);
  const [name, setName] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [dueDay, setDueDay] = useState("5");
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    api<Property[]>("/api/properties").then(setList).catch(() => setList([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);
    try {
      await api("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rentAmount: Number(rentAmount),
          dueDay: Number(dueDay),
          tenantName: tenantName || undefined,
          tenantPhone: tenantPhone || undefined,
        }),
      });
      setName("");
      setRentAmount("");
      setDueDay("5");
      setTenantName("");
      setTenantPhone("");
      setMsg("Property saved.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this property and its tenants?")) return;
    await api(`/api/properties/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Properties</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Add a unit, rent, due day, and optional tenant in one step.</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Property name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Flat A101"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Rent (₹ / month)</label>
          <input
            required
            type="number"
            min={0}
            value={rentAmount}
            onChange={(e) => setRentAmount(e.target.value)}
            placeholder="15000"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Due day of month (1–31)</label>
          <input
            required
            type="number"
            min={1}
            max={31}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Tenant name (optional)</label>
          <input
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Tenant phone (optional)</label>
          <input
            value={tenantPhone}
            onChange={(e) => setTenantPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        {msg && <p className="text-sm text-emerald-700 sm:col-span-2 dark:text-emerald-400">{msg}</p>}
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Saving…" : "Add property"}
          </button>
        </div>
      </form>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/80">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Rent</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p._id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3">₹{p.rentAmount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">{p.dueDay}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="text-red-600 text-sm" onClick={() => remove(p._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  No properties yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
