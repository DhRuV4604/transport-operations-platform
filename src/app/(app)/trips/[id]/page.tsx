import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { KpiCard } from "@/components/kpi-card";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-20 text-center text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  const trip = await db.trip.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: true,
      fuelLogs: { orderBy: { date: "desc" } },
      expenses: { orderBy: { date: "desc" } },
    },
  });
  if (!trip) notFound();

  const fuelCost = trip.fuelLogs.reduce((s, f) => s + f.cost, 0);
  const otherExpenses = trip.expenses.reduce((s, e) => s + e.amount, 0);
  const distanceTravelled =
    trip.startOdometerKm != null && trip.endOdometerKm != null
      ? trip.endOdometerKm - trip.startOdometerKm
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/trips"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Trips
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            {trip.source} → {trip.destination}
          </h1>
          <StatusBadge status={trip.status} />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {trip.vehicle.regNumber} ({trip.vehicle.name}) · {trip.driver.name} ·{" "}
        {trip.cargoWeightKg.toLocaleString()} kg cargo · {trip.plannedDistanceKm.toLocaleString()}{" "}
        km planned · created {format(trip.createdAt, "dd MMM yyyy")}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Revenue" value={inr(trip.revenue)} />
        <KpiCard label="Fuel cost" value={inr(fuelCost)} />
        <KpiCard label="Other expenses" value={inr(otherExpenses)} />
        <KpiCard
          label="Odometer at dispatch"
          value={trip.startOdometerKm != null ? `${trip.startOdometerKm.toLocaleString()} km` : "—"}
        />
        <KpiCard
          label="Distance travelled"
          value={distanceTravelled != null ? `${distanceTravelled.toLocaleString()} km` : "—"}
          sub={
            trip.endOdometerKm != null
              ? `Ended at ${trip.endOdometerKm.toLocaleString()} km`
              : "Trip not yet completed"
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lifecycle</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
          <div>
            <div className="text-muted-foreground">Created</div>
            <div className="font-medium">{format(trip.createdAt, "dd MMM yyyy, HH:mm")}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Dispatched</div>
            <div className="font-medium">
              {trip.dispatchedAt ? format(trip.dispatchedAt, "dd MMM yyyy, HH:mm") : "—"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Completed</div>
            <div className="font-medium">
              {trip.completedAt ? format(trip.completedAt, "dd MMM yyyy, HH:mm") : "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fuel & expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fuel">
            <TabsList>
              <TabsTrigger value="fuel">Fuel ({trip.fuelLogs.length})</TabsTrigger>
              <TabsTrigger value="expenses">Expenses ({trip.expenses.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="fuel" className="mt-3 rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Liters</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trip.fuelLogs.length === 0 ? (
                    <EmptyRow colSpan={3} message="No fuel logs for this trip." />
                  ) : (
                    trip.fuelLogs.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>{f.liters.toLocaleString()} L</TableCell>
                        <TableCell>{inr(f.cost)}</TableCell>
                        <TableCell>{format(f.date, "dd MMM yyyy")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="expenses" className="mt-3 rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trip.expenses.length === 0 ? (
                    <EmptyRow colSpan={4} message="No expenses for this trip." />
                  ) : (
                    trip.expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.category}</TableCell>
                        <TableCell className="font-medium">{e.description}</TableCell>
                        <TableCell>{inr(e.amount)}</TableCell>
                        <TableCell>{format(e.date, "dd MMM yyyy")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
