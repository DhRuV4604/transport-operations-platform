import Link from "next/link";
import { format } from "date-fns";
import {
  Truck,
  Gauge,
  Route,
  Users,
  Plus,
  CalendarClock,
  FileWarning,
  Wrench,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { hasPermission, VEHICLE_TYPES, VEHICLE_STATUS, REGIONS } from "@/lib/constants";
import { getKpis } from "@/server/services/analyticsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { FleetStatusChart } from "@/components/charts/fleet-status-chart";
import { DashboardFilters } from "./dashboard-filters";

function pick(value: string | string[] | undefined, allowed: readonly string[]) {
  return typeof value === "string" && allowed.includes(value) ? value : undefined;
}

const TONE_VAR: Record<string, string> = {
  warning: "var(--color-warning)",
  info: "var(--color-info)",
  shop: "var(--color-status-shop)",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const canDispatch = hasPermission(session.role, "trips.write");
  const canAddVehicle = hasPermission(session.role, "vehicles.write");

  const filters = {
    type: pick(params.type, VEHICLE_TYPES),
    status: pick(params.status, VEHICLE_STATUS),
    region: pick(params.region, REGIONS),
  };

  const kpis = await getKpis(filters);
  const { onTrip, available, inShop, retired } = kpis.fleetStatus;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const attention = [
    {
      label: "Licenses expiring",
      desc: "Expired or due within 30 days",
      count: kpis.expiringLicenses,
      href: "/drivers",
      tone: "warning",
      icon: CalendarClock,
    },
    {
      label: "Documents expiring",
      desc: "Vehicle papers due soon",
      count: kpis.expiringDocuments,
      href: "/vehicles",
      tone: "warning",
      icon: FileWarning,
    },
    {
      label: "Awaiting dispatch",
      desc: "Draft trips not yet sent",
      count: kpis.draftTrips,
      href: "/trips",
      tone: "info",
      icon: Route,
    },
    {
      label: "In the shop",
      desc: "Vehicles under maintenance",
      count: inShop,
      href: "/maintenance",
      tone: "shop",
      icon: Wrench,
    },
  ];
  const totalAttention = attention.reduce((s, a) => s + a.count, 0);

  return (
    <div className="space-y-6">
      {/* hero */}
      <div className="-mx-4 -mt-4 border-b px-4 pt-5 pb-5 md:-mx-6 md:-mt-6 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {format(new Date(), "EEEE, d MMMM")}
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tighter">
              {greeting}, {session.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Fleet health at a glance — {onTrip} on the road, {available} ready to roll.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canDispatch && (
              <Button render={<Link href="/trips?new=1" />} nativeButton={false}>
                <Plus className="size-4" /> New trip
              </Button>
            )}
            {canAddVehicle && (
              <Button
                variant="outline"
                render={<Link href="/vehicles?new=1" />}
                nativeButton={false}
              >
                <Plus className="size-4" /> Add vehicle
              </Button>
            )}
            <DashboardFilters />
          </div>
        </div>
      </div>

      {/* primary KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Vehicles on trip" value={onTrip} icon={Truck} sub="Currently dispatched" />
        <KpiCard
          label="Fleet utilization"
          value={`${kpis.utilizationPct}%`}
          icon={Gauge}
          progress={kpis.utilizationPct}
          sub="On-trip share of the active fleet"
        />
        <KpiCard
          label="Active trips"
          value={kpis.activeTrips}
          icon={Route}
          sub={`${kpis.draftTrips} awaiting dispatch`}
          href="/trips"
        />
        <KpiCard
          label="Drivers on duty"
          value={kpis.driversOnDuty}
          icon={Users}
          sub="Available or on a trip"
          href="/drivers"
        />
      </div>

      {/* fleet status + attention */}
      <div className="grid gap-4 lg:grid-cols-2">
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

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Needs attention</CardTitle>
            {totalAttention > 0 && (
              <span className="inline-flex h-5 items-center rounded-full bg-warning/12 px-2 text-xs font-medium text-warning tabular-nums">
                {totalAttention} open
              </span>
            )}
          </CardHeader>
          <CardContent>
            {totalAttention === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <CheckCircle2 className="size-8 text-success" />
                <p className="text-sm font-medium">All clear</p>
                <p className="text-xs text-muted-foreground">
                  Nothing expiring and no trips waiting to go out.
                </p>
              </div>
            ) : (
              <ul className="-mx-2 space-y-0.5">
                {attention.map((a) => {
                  const live = a.count > 0;
                  const color = live ? TONE_VAR[a.tone] : "var(--color-muted-foreground)";
                  return (
                    <li key={a.label}>
                      <Link
                        href={a.href}
                        className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
                      >
                        <span
                          className="grid size-8 shrink-0 place-items-center rounded-lg"
                          style={{
                            color,
                            backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)`,
                          }}
                        >
                          <a.icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">{a.label}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {a.desc}
                          </span>
                        </span>
                        <span
                          className="text-lg font-semibold tabular-nums"
                          style={{ color: live ? color : undefined }}
                        >
                          {a.count}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
