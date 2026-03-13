"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { SessionForm } from "@/components/SessionForm";

function LogSessionContent() {
  const params = useSearchParams();
  const prefilledTargetId = params.get("target") ?? undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold">Log session</h1>
      <SessionForm prefilledTargetId={prefilledTargetId} />
    </motion.div>
  );
}

export default function LogSessionPage() {
  return (
    <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
      <LogSessionContent />
    </Suspense>
  );
}
