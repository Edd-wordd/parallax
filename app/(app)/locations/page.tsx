"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LocationsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [darkerSitesOpen, setDarkerSitesOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Locations</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDarkerSitesOpen(true)}>
            Find darker sites nearby
          </Button>
          <Button onClick={() => setModalOpen(true)}>Add location</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MOCK_LOCATIONS.map((loc) => (
          <motion.div
            key={loc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <h2 className="font-medium">{loc.name}</h2>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-zinc-400">
                <div>{loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}</div>
                <div>Bortle: {loc.bortle}</div>
                {loc.notes && <div className="text-zinc-500">{loc.notes}</div>}
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
            <h3 className="text-lg font-medium mb-4">Add location (mock)</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Fields: name, lat, lon, bortle, notes (horizon obstructions).
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Save</Button>
            </div>
          </motion.div>
        </div>
      )}

      {darkerSitesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setDarkerSitesOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-zinc-700 bg-zinc-900 p-6 w-full max-w-lg"
          >
            <h3 className="text-lg font-medium mb-4">Darker sites nearby (mock)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between rounded border border-zinc-700 p-2">
                <span>Pinnacles Dark Site</span>
                <span className="text-cyan-400">45 min drive · Bortle 4</span>
              </div>
              <div className="flex justify-between rounded border border-zinc-700 p-2">
                <span>Mount Diablo</span>
                <span className="text-cyan-400">1h 10m · Bortle 5</span>
              </div>
              <div className="flex justify-between rounded border border-zinc-700 p-2">
                <span>Death Valley</span>
                <span className="text-cyan-400">8h · Bortle 1</span>
              </div>
            </div>
            <Button className="mt-4" onClick={() => setDarkerSitesOpen(false)}>Close</Button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
