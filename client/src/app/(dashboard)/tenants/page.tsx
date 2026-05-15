"use client";

import { useCallback, useEffect, useState } from "react";
import { api, API_BASE, getToken } from "@/lib/api";

type Property = { _id: string; name: string; rentAmount: number; dueDay: number };
type Tenant = {
  _id: string;
  name: string;
  phone: string;
  rentAmount: number;
  paymentStatus: "paid" | "pending";
  propertyId: Property | string;
};

type LeaseFile = { _id: string; fileName: string; blobUrl: string; docType: string };

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [uploadTenant, setUploadTenant] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState("");

  const load = useCallback(() => {
    Promise.all([api<Tenant[]>("/api/tenants"), api<Property[]>("/api/properties")]).then(([t, p]) => {
      setTenants(t);
      setProperties(p);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (properties.length > 0 && !propertyId) {
      setPropertyId(properties[0]._id);
    }
  }, [properties, propertyId]);

  async function addTenant(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        name,
        phone,
        rentAmount: Number(rentAmount),
      }),
    });
    setName("");
    setPhone("");
    setRentAmount("");
    load();
  }

  async function setStatus(id: string, paymentStatus: "paid" | "pending") {
    await api(`/api/tenants/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus }),
    });
    load();
  }

  function propName(t: Tenant) {
    const p = t.propertyId;
    return typeof p === "object" && p?.name ? p.name : "—";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Tenants</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Tenant list, payment status, and document uploads.</p>
      </div>
      <form onSubmit={addTenant} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-sm font-medium">Property</label>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          >
            {properties.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Tenant name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Rent (₹)</label>
          <input
            required
            type="number"
            min={0}
            value={rentAmount}
            onChange={(e) => setRentAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div className="lg:col-span-4">
          <button
            type="submit"
            disabled={!propertyId || properties.length === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Add tenant
          </button>
        </div>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/80">
            <tr>
              <th className="px-4 py-3 font-medium">Tenant</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Property</th>
              <th className="px-4 py-3 font-medium">Rent</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t._id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3">{t.phone || "—"}</td>
                <td className="px-4 py-3">{propName(t)}</td>
                <td className="px-4 py-3">₹{t.rentAmount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.paymentStatus === "paid"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                        : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                    }`}
                  >
                    {t.paymentStatus === "paid" ? "Paid" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {t.paymentStatus === "pending" ? (
                      <button
                        type="button"
                        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"
                        onClick={() => setStatus(t._id, "paid")}
                      >
                        Mark paid
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
                        onClick={() => setStatus(t._id, "pending")}
                      >
                        Mark pending
                      </button>
                    )}
                    <button
                      type="button"
                      className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
                      onClick={() => setUploadTenant(uploadTenant === t._id ? null : t._id)}
                    >
                      Upload
                    </button>
                  </div>
                  {uploadTenant === t._id && (
                    <UploadRow
                      tenantId={t._id}
                      onUploaded={() => {
                        setUploadTenant(null);
                        setUploadErr("");
                      }}
                      onError={setUploadErr}
                    />
                  )}
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Add a property first, then add tenants here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {uploadErr && <p className="text-sm text-red-600">{uploadErr}</p>}
    </div>
  );
}

function UploadRow({
  tenantId,
  onUploaded,
  onError,
}: {
  tenantId: string;
  onUploaded: () => void;
  onError: (s: string) => void;
}) {
  const [docType, setDocType] = useState("agreement");
  const [files, setFiles] = useState<LeaseFile[]>([]);

  useEffect(() => {
    api<LeaseFile[]>(`/api/uploads/tenant/${tenantId}`)
      .then(setFiles)
      .catch(() => setFiles([]));
  }, [tenantId]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("tenantId", tenantId);
    fd.append("docType", docType);
    const h = new Headers();
    const t = getToken();
    if (t) h.set("Authorization", `Bearer ${t}`);
    const res = await fetch(`${API_BASE}/api/uploads`, { method: "POST", body: fd, headers: h });
    if (!res.ok) {
      let msg = "Upload failed";
      try {
        const j = await res.json();
        if (j?.error) msg = j.error;
      } catch {
        /* ignore */
      }
      onError(msg);
      return;
    }
    onUploaded();
    const list = await api<LeaseFile[]>(`/api/uploads/tenant/${tenantId}`);
    setFiles(list);
    e.target.value = "";
  }

  return (
    <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950">
      <p className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">Azure Blob upload (agreement / ID)</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
        >
          <option value="agreement">Rent agreement</option>
          <option value="id_proof">ID proof</option>
          <option value="other">Other</option>
        </select>
        <input type="file" accept=".pdf,image/*" onChange={onFile} className="max-w-[200px]" />
      </div>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f) => (
            <li key={f._id}>
              <a href={f.blobUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline dark:text-emerald-400">
                {f.fileName} ({f.docType})
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
