"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getToken } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const t = getToken();
    router.replace(t ? "/dashboard" : "/login");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 text-zinc-500 dark:bg-zinc-950">
      Redirecting…
    </div>
  );
}
