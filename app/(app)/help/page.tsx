"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HelpPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 max-w-3xl"
    >
      <div>
        <h1 className="page-heading">Help</h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          How Parallax scores, sites, and recommendations stay grounded in real
          data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What does shootability score mean?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-400 leading-relaxed">
          <p>
            The shootability score (0–100) combines visibility, moon separation,
            altitude, and target difficulty. Higher scores mean better
            conditions for capturing that target tonight. Scores above 70 are
            typically ideal; 50–70 may require longer integration or better
            gear.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Why does location matter (Bortle)?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-400 leading-relaxed">
          <p>
            Light pollution is measured on the Bortle scale (1–9). Darker skies
            (lower Bortle) dramatically improve contrast for nebulae and
            galaxies. Bortle 1–3 are excellent; 4–5 are good; 6–7 work for
            brighter targets; 8–9 (urban) limit you to planets and bright
            clusters.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How does the app avoid AI hallucinations?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-400 leading-relaxed">
          <p>
            Recommendations use deterministic filtering (altitude limits, moon
            distance, target catalog) rather than free-form generation. This
            keeps results grounded in real astronomical data and avoids invented
            targets or incorrect visibility windows.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
