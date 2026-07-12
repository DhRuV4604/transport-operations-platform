import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { ExpiryBadge } from "@/components/expiry-badge";
import { KpiCard } from "@/components/kpi-card";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  const driver = await db.driver.findUnique({
    where: { id },
    include: {
      trips: { include: { vehicle: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!driver) notFound();

  const completedTrips = driver.trips.filter((t) => t.status === "COMPLETED");
  const revenue = completedTrips.reduce((s, t) => s + t.revenue, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/drivers"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Drivers
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{driver.name}</h1>
          <StatusBadge status={driver.status} />
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {driver.licenseNumber} · {driver.licenseCategory} · License expiry:{" "}
        <ExpiryBadge date={driver.licenseExpiry} /> · {driver.phone}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Safety score"
          value={driver.safetyScore}
          tone={driver.safetyScore < 60 ? "warning" : "default"}
        />
        <KpiCard label="Total trips" value={driver.trips.length} />
        <KpiCard label="Completed trips" value={completedTrips.length} />
        <KpiCard label="Revenue generated" value={inr(revenue)} sub="Completed trips only" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trip history</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driver.trips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                      No trips for this driver.
                    </TableCell>
                  </TableRow>
                ) : (
                  driver.trips.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        <Link href={`/trips/${t.id}`} className="underline-offset-4 hover:underline">
                          {t.source} → {t.destination}
                        </Link>
                      </TableCell>
                      <TableCell>{t.vehicle.regNumber}</TableCell>
                      <TableCell>{t.cargoWeightKg.toLocaleString()} kg</TableCell>
                      <TableCell>{inr(t.revenue)}</TableCell>
                      <TableCell>{format(t.createdAt, "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
