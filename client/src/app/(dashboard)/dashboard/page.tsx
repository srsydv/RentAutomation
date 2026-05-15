"use client";

import { useEffect, useState } from "react";
import { api, downloadPdf } from "@/lib/api";
import Link from "next/link";

type Stats = { totalProperties: number; paidRents: number; pendingRents: number };

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    api<Stats>("/api/dashboard/stats")
      .then(setStats)
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Overview of your portfolio and rent status.</p>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total properties" value={stats?.totalProperties ?? "—"} tone="slate" />
        <StatCard label="Paid (tenants)" value={stats?.paidRents ?? "—"} tone="emerald" />
        <StatCard label="Pending (tenants)" value={stats?.pendingRents ?? "—"} tone="amber" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/properties"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Add property
        </Link>
        <Link
          href="/tenants"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
        >
          View tenants
        </Link>
        <button
          type="button"
          disabled={pdfLoading}
          onClick={async () => {
            setPdfLoading(true);
            try {
              await downloadPdf("/api/reports/rent-report.pdf", "rent-report.pdf");
            } catch (e) {
              alert(e instanceof Error ? e.message : "PDF failed");
            } finally {
              setPdfLoading(false);
            }
          }}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600 disabled:opacity-50"
        >
          {pdfLoading ? "Exporting…" : "Export rent PDF"}
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "slate" | "emerald" | "amber";
}) {
  const ring =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";
  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${ring}`}>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
