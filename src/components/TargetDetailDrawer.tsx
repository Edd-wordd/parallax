"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTargetById } from "@/lib/mock/recommendations";

interface TargetDetailDrawerProps {
  targetId: string | null;
  onClose: () => void;
}

export function TargetDetailDrawer({ targetId, onClose }: TargetDetailDrawerProps) {
  const target = targetId ? getTargetById(targetId) : null;

  return (
    <AnimatePresence>
      {target && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">{target.name}</h3>
                <Button size="icon" variant="ghost" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 text-sm text-zinc-400">
                <span className="capitalize">{target.type.replace("_", " ")}</span>
                <span>· Mag {target.magnitude}</span>
                <span>· {target.constellation}</span>
              </div>
              <div className="mt-4">
                <Link href={`/targets/${target.id}`}>
                  <Button variant="outline" className="w-full">
                    View full detail
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-zinc-500">
                Use your telescope at f/5–f/7. Stack 30–60 subframes. Dark skies recommended.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
