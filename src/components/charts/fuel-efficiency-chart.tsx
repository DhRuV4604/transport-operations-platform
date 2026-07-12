"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

export type FuelEfficiencyDatum = {
  regNumber: string;
  name: string;
  km: number;
  liters: number;
  kmPerLiter: number;
};

export function FuelEfficiencyChart({ data }: { data: FuelEfficiencyDatum[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No completed trips with fuel logs yet.
      </p>
    );
  }

  return (
    <div style={{ height: data.length * 44 + 40 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis
            type="number"
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
              const d = payload[0].payload as FuelEfficiencyDatum;
              return (
                <ChartTooltip
                  title={`${d.regNumber} · ${d.name}`}
                  lines={[
                    `${d.kmPerLiter} km/L`,
                    `${d.km.toLocaleString()} km over ${d.liters.toLocaleString()} L`,
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="kmPerLiter" fill="var(--viz-1)" barSize={18} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList
              dataKey="kmPerLiter"
              position="right"
              formatter={(v) => `${v} km/L`}
              style={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
