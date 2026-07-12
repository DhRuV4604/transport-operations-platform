import { requireSession } from "@/lib/auth";
import { VEHICLE_TYPES, VEHICLE_STATUS, REGIONS } from "@/lib/constants";
import { getKpis } from "@/server/services/analyticsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { FleetStatusChart } from "@/components/charts/fleet-status-chart";
import { DashboardFilters } from "./dashboard-filters";

function pick(value: string | string[] | undefined, allowed: readonly string[]) {
  return typeof value === "string" && allowed.includes(value) ? value : undefined;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const filters = {
    type: pick(params.type, VEHICLE_TYPES),
    status: pick(params.status, VEHICLE_STATUS),
    region: pick(params.region, REGIONS),
  };

  const kpis = await getKpis(filters);
  const { onTrip, available, inShop, retired } = kpis.fleetStatus;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {session.name.split(" ")[0]} — fleet health at a glance
          </p>
        </div>
        <DashboardFilters />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Vehicles on trip" value={onTrip} />
        <KpiCard label="Available vehicles" value={available} />
        <KpiCard label="In maintenance" value={inShop} />
        <KpiCard
          label="Fleet utilization"
          value={`${kpis.utilizationPct}%`}
          sub="On-trip share of the active fleet"
        />
        <KpiCard label="Active trips" value={kpis.activeTrips} sub="Currently dispatched" />
        <KpiCard label="Pending trips" value={kpis.draftTrips} sub="Drafts awaiting dispatch" />
        <KpiCard label="Drivers on duty" value={kpis.driversOnDuty} sub="Available or on a trip" />
        <KpiCard
          label="Expiring licenses"
          value={kpis.expiringLicenses}
          sub="Expired or expiring within 30 days"
          tone={kpis.expiringLicenses > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Documents expiring soon"
          value={kpis.expiringDocuments}
          sub="Vehicle documents expired or due within 30 days"
          tone={kpis.expiringDocuments > 0 ? "warning" : "default"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fleet status</CardTitle>
        </CardHeader>
        <CardContent>
          <FleetStatusChart
            data={[
              { status: "AVAILABLE", count: available },
              { status: "ON_TRIP", count: onTrip },
              { status: "IN_SHOP", count: inShop },
              { status: "RETIRED", count: retired },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
