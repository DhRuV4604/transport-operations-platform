"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { STATUS_LABELS } from "@/lib/constants";
import { ChartTooltip } from "./chart-tooltip";

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "var(--viz-good)",
  ON_TRIP: "var(--viz-1)",
  IN_SHOP: "var(--viz-warn)",
  RETIRED: "var(--viz-neutral)",
};

export type FleetStatusDatum = { status: string; count: number };

export function FleetStatusChart({ data }: { data: FleetStatusDatum[] }) {
  const slices = data.filter((d) => d.count > 0);
  const total = slices.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No vehicles match the current filters.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              outerRadius={90}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((d) => (
                <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? "var(--viz-neutral)"} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as FleetStatusDatum;
                return (
                  <ChartTooltip
                    title={STATUS_LABELS[d.status] ?? d.status}
                    lines={[`${d.count} of ${total} vehicles (${Math.round((d.count / total) * 100)}%)`]}
                  />
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2 text-sm">
        {slices.map((d) => (
          <li key={d.status} className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ background: STATUS_COLORS[d.status] ?? "var(--viz-neutral)" }}
            />
            <span>{STATUS_LABELS[d.status] ?? d.status}</span>
            <span className="ml-auto pl-4 font-medium tabular-nums">{d.count}</span>
          </li>
        ))}
        <li className="flex items-center gap-2 border-t pt-2 text-muted-foreground">
          <span className="h-3 w-3 shrink-0" />
          <span>Total</span>
          <span className="ml-auto pl-4 font-medium tabular-nums">{total}</span>
        </li>
      </ul>
    </div>
  );
}
