"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartTooltip, inr } from "./chart-tooltip";

export type VehicleCostDatum = {
  regNumber: string;
  name: string;
  fuelCost: number;
  maintenanceCost: number;
  otherExpenses: number;
  totalCost: number;
};

const SERIES = [
  { key: "fuelCost", label: "Fuel", color: "var(--viz-1)" },
  { key: "maintenanceCost", label: "Maintenance", color: "var(--viz-2)" },
] as const;

export function CostChart({ data }: { data: VehicleCostDatum[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No fuel or maintenance spend recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="flex gap-4 text-xs text-muted-foreground">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>
      <div style={{ height: data.length * 44 + 40 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis
              type="number"
              tickFormatter={(v: number) => `₹${(v / 1000).toLocaleString()}k`}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="regNumber"
              width={110}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as VehicleCostDatum;
                return (
                  <ChartTooltip
                    title={`${d.regNumber} · ${d.name}`}
                    lines={[
                      `Fuel: ${inr(d.fuelCost)}`,
                      `Maintenance: ${inr(d.maintenanceCost)}`,
                      `Total (incl. other): ${inr(d.totalCost)}`,
                    ]}
                  />
                );
              }}
            />
            <Bar
              dataKey="fuelCost"
              stackId="cost"
              fill="var(--viz-1)"
              barSize={18}
              stroke="var(--card)"
              strokeWidth={1}
              isAnimationActive={false}
            />
            <Bar
              dataKey="maintenanceCost"
              stackId="cost"
              fill="var(--viz-2)"
              barSize={18}
              radius={[0, 4, 4, 0]}
              stroke="var(--card)"
              strokeWidth={1}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
