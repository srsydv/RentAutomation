"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/properties", label: "Properties" },
  { href: "/tenants", label: "Tenants" },
  { href: "/payments", label: "Payments" },
];

type Notif = { _id: string; title: string; message: string; read: boolean; createdAt: string };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const loadNotifs = useCallback(() => {
    api<Notif[]>("/api/notifications")
      .then(setNotifs)
      .catch(() => setNotifs([]));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    loadNotifs();
  }, [user, ready, router, loadNotifs]);

  useEffect(() => {
    if (!notifOpen || !user) return;
    loadNotifs();
  }, [notifOpen, user, loadNotifs]);

  const unread = notifs.filter((n) => !n.read).length;

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 text-zinc-500 dark:bg-zinc-950">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-emerald-700 dark:text-emerald-400">
            RentLandlord
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === item.href
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                Alerts
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-auto rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                  {notifs.length === 0 ? (
                    <p className="p-3 text-sm text-zinc-500">No notifications yet.</p>
                  ) : (
                    notifs.map((n) => (
                      <div
                        key={n._id}
                        className={`rounded-lg p-3 text-sm ${n.read ? "opacity-60" : "bg-amber-50 dark:bg-amber-950/30"}`}
                      >
                        <p className="font-medium">{n.title}</p>
                        <p className="text-zinc-600 dark:text-zinc-400">{n.message}</p>
                      </div>
                    ))
                  )}
                  {notifs.some((n) => !n.read) && (
                    <button
                      type="button"
                      className="mt-2 w-full rounded-lg bg-zinc-900 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                      onClick={() =>
                        api("/api/notifications/read-all", { method: "POST" }).then(() => loadNotifs())
                      }
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              )}
            </div>
            <span className="hidden max-w-[140px] truncate text-sm text-zinc-500 sm:inline">{user.email}</span>
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
            >
              Log out
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-zinc-100 px-4 py-2 md:hidden dark:border-zinc-800">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                pathname === item.href ? "bg-emerald-600 text-white" : "text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
