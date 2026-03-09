"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GearPage() {
  const { activeGearId, setActiveGear } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gear profiles</h1>
        <Button onClick={() => setModalOpen(true)}>Add profile</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_GEAR.map((g) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <Card className={g.active ? "border-cyan-500/50" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <h2 className="font-medium">{g.name}</h2>
                  {g.active ? (
                    <span className="text-xs text-cyan-400">Active</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveGear(g.id)}
                    >
                      Set as active
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-400">
                <div>Telescope: {g.telescope_name}</div>
                <div>Focal: {g.focal_length}mm · Aperture: {g.aperture}mm</div>
                <div>Camera: {g.camera_name} ({g.sensor_preset})</div>
                <div>
                  Mount: {g.mount_type} · Guiding: {g.guiding ? "Yes" : "No"}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-zinc-700 bg-zinc-900 p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-medium mb-4">Add gear profile (mock)</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Form fields: telescope name, focal length, aperture, camera, sensor preset, mount type, guiding.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Save
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
