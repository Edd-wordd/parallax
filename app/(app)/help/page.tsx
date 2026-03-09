"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-3xl"
    >
      <h1 className="text-2xl font-bold">Help</h1>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">What does shootability score mean?</h2>
        </CardHeader>
        <CardContent className="prose prose-invert prose-sm max-w-none">
          <p>
            The shootability score (0–100) combines visibility, moon separation, altitude, and
            target difficulty. Higher scores mean better conditions for capturing that target
            tonight. Scores above 70 are typically ideal; 50–70 may require longer integration
            or better gear.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Why does location matter (Bortle)?</h2>
        </CardHeader>
        <CardContent className="prose prose-invert prose-sm max-w-none">
          <p>
            Light pollution is measured on the Bortle scale (1–9). Darker skies (lower Bortle)
            dramatically improve contrast for nebulae and galaxies. Bortle 1–3 are excellent;
            4–5 are good; 6–7 work for brighter targets; 8–9 (urban) limit you to planets and
            bright clusters.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">How does the app avoid AI hallucinations?</h2>
        </CardHeader>
        <CardContent className="prose prose-invert prose-sm max-w-none">
          <p>
            Recommendations use deterministic filtering (altitude limits, moon distance, target
            catalog) rather than free-form generation. This keeps results grounded in real
            astronomical data and avoids invented targets or incorrect visibility windows.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
