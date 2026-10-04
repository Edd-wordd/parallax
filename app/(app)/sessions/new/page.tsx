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
    <p className="text-sm text-zinc-500 py-10 text-center">
      Sessions are created by saving a mission log. Redirecting…
    </p>
  );
}
