"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Standalone session log cut for Phase D — sessions come from mission Save Log. */
export default function NewSessionRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/sessions");
  }, [router]);
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-4 py-10 text-center">
      <p className="text-sm text-zinc-400">
        Sessions are created by saving a mission log.
      </p>
      <p className="mt-1 text-[11px] text-zinc-500">Redirecting…</p>
    </div>
  );
}
