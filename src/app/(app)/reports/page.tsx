import { format } from "date-fns";
import { requireSession } from "@/lib/auth";
import {
  getFuelEfficiencyReport,
  getVehicleCostReport,
  getFleetUtilization,
  getRoiReport,
  type DateRange,
} from "@/server/services/analyticsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataRow } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { FuelEfficiencyChart } from "@/components/charts/fuel-efficiency-chart";
import { CostChart } from "@/components/charts/cost-chart";
import { UtilizationChart } from "@/components/charts/utilization-chart";
import { PrintButton } from "@/components/print-button";
import { ReportsDateFilter } from "./reports-date-filter";
import { cn } from "@/lib/utils";

function parseDate(value: string | string[] | undefined) {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSession();
  const params = await searchParams;

  const range: DateRange = { from: parseDate(params.from), to: parseDate(params.to) };
  const rangeLabel =
    range.from && range.to
      ? `${format(range.from, "dd MMM yyyy")} – ${format(range.to, "dd MMM yyyy")}`
      : "All time";

  const [fuelEfficiency, costs, utilization, roi] = await Promise.all([
    getFuelEfficiencyReport(range),
    getVehicleCostReport(range),
    getFleetUtilization(),
    getRoiReport(range),
  ]);

  const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  const roiRows: DataRow[] = roi.map((r) => ({
    id: r.vehicleId,
    cells: {
      regNumber: { value: r.regNumber, node: <span className="font-medium">{r.regNumber}</span> },
      name: { value: r.name },
      status: { value: r.status, node: <StatusBadge status={r.status} /> },
      revenue: { value: r.revenue, node: inr(r.revenue) },
      fuelCost: { value: r.fuelCost, node: inr(r.fuelCost) },
      maintenanceCost: { value: r.maintenanceCost, node: inr(r.maintenanceCost) },
      net: {
        value: r.net,
        node: (
          <span className={cn("tabular-nums", r.net < 0 && "text-destructive")}>{inr(r.net)}</span>
        ),
      },
      roiPct: {
        value: r.roiPct,
        node: (
          <span className={cn("font-medium tabular-nums", r.roiPct < 0 && "text-destructive")}>
            {r.roiPct}%
          </span>
        ),
      },
    },
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Fuel efficiency, operational cost, utilization, and vehicle ROI · {rangeLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReportsDateFilter />
          <PrintButton />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 print-page-break">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fuel efficiency (km/L)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Completed-trip distance against trip-linked fuel volume
            </p>
          </CardHeader>
          <CardContent>
            <FuelEfficiencyChart data={fuelEfficiency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fleet utilization by type</CardTitle>
            <p className="text-xs text-muted-foreground">
              On-trip share of the non-retired fleet, right now
            </p>
          </CardHeader>
          <CardContent>
            <UtilizationChart data={utilization} />
          </CardContent>
        </Card>
      </div>

      <Card className="print-page-break">
        <CardHeader>
          <CardTitle className="text-base">Operational cost per vehicle</CardTitle>
          <p className="text-xs text-muted-foreground">Fuel and maintenance spend · {rangeLabel}</p>
        </CardHeader>
        <CardContent>
          <CostChart data={costs} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vehicle ROI</CardTitle>
          <p className="text-xs text-muted-foreground">
            (Revenue − fuel − maintenance) ÷ acquisition cost
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: "regNumber", label: "Vehicle" },
              { key: "name", label: "Name / Model" },
              { key: "status", label: "Status" },
              { key: "revenue", label: "Revenue" },
              { key: "fuelCost", label: "Fuel" },
              { key: "maintenanceCost", label: "Maintenance" },
              { key: "net", label: "Net" },
              { key: "roiPct", label: "ROI" },
            ]}
            rows={roiRows}
            searchPlaceholder="Search vehicles…"
            exportHref="/api/export/roi"
            emptyMessage="No vehicles yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
