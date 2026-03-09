"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartResizeGuard } from "@/components/ChartResizeGuard";

const successTrends = [
  { month: "Sep", rate: 60 },
  { month: "Oct", rate: 65 },
  { month: "Nov", rate: 72 },
  { month: "Dec", rate: 68 },
  { month: "Jan", rate: 75 },
];
const bestLocations = [
  { name: "Death Valley", sessions: 3, success: 100 },
  { name: "Pinnacles", sessions: 12, success: 83 },
  { name: "Mount Diablo", sessions: 8, success: 75 },
  { name: "Home", sessions: 15, success: 53 },
];
const targetPerformance = [
  { name: "Nebula", value: 35 },
  { name: "Galaxy", value: 28 },
  { name: "Cluster", value: 25 },
  { name: "Planet", value: 12 },
];
const COLORS = ["#22d3ee", "#2dd4bf", "#34d399", "#a78bfa"];

export default function InsightsPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold">Analytics & Insights</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Success rate trend</h2>
          </CardHeader>
          <CardContent>
            <ChartResizeGuard height={200} minHeight={120}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={successTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#27272a",
                      border: "1px solid #52525b",
                      borderRadius: "6px",
                    }}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#22d3ee" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartResizeGuard>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Best locations</h2>
          </CardHeader>
          <CardContent>
            <ChartResizeGuard height={200} minHeight={120}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestLocations} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis type="number" stroke="#71717a" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={11} width={55} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#27272a",
                      border: "1px solid #52525b",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar dataKey="success" fill="#22d3ee" radius={[0, 4, 4, 0]} name="Success %" />
                </BarChart>
              </ResponsiveContainer>
            </ChartResizeGuard>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Target type performance</h2>
          </CardHeader>
          <CardContent>
            <ChartResizeGuard height={200} minHeight={120}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={targetPerformance}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {targetPerformance.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#27272a",
                      border: "1px solid #52525b",
                      borderRadius: "6px",
                    }}
                    formatter={(v) => [`${v ?? 0}%`, "Share"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartResizeGuard>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Recommended conditions</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• Bortle 5 or darker for best results</li>
              <li>• Moon &lt;25% or &gt;40° separation</li>
              <li>• Seeing 3/5 or better</li>
              <li>• Nebulae perform well in Bortle 7</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
