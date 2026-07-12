import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Download } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { hasPermission } from "@/lib/constants";
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
import { ExpiryBadge } from "@/components/expiry-badge";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { UploadDocumentDialog, DeleteDocumentButton } from "./vehicle-document-forms";

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

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const canWrite = hasPermission(session.role, "vehicles.write");
  const { id } = await params;

  const vehicle = await db.vehicle.findUnique({
    where: { id },
    include: {
      trips: { include: { driver: true }, orderBy: { createdAt: "desc" } },
      maintenanceLogs: { orderBy: { openedAt: "desc" } },
      fuelLogs: { include: { trip: true }, orderBy: { date: "desc" } },
      expenses: { orderBy: { date: "desc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });
  if (!vehicle) notFound();

  const fuelCost = vehicle.fuelLogs.reduce((s, f) => s + f.cost, 0);
  const maintenanceCost = vehicle.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
  const otherExpenses = vehicle.expenses.reduce((s, e) => s + e.amount, 0);
  const revenue = vehicle.trips
    .filter((t) => t.status === "COMPLETED")
    .reduce((s, t) => s + t.revenue, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/vehicles"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Vehicles
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{vehicle.regNumber}</h1>
          <StatusBadge status={vehicle.status} />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {vehicle.name} · {vehicle.type} · {vehicle.region} region ·{" "}
        {vehicle.maxLoadKg.toLocaleString()} kg max load ·{" "}
        {vehicle.odometerKm.toLocaleString()} km odometer
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Revenue (completed trips)" value={inr(revenue)} />
        <KpiCard label="Fuel cost" value={inr(fuelCost)} />
        <KpiCard label="Maintenance cost" value={inr(maintenanceCost)} />
        <KpiCard label="Other expenses" value={inr(otherExpenses)} />
        <KpiCard
          label="Total operating cost"
          value={inr(fuelCost + maintenanceCost + otherExpenses)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="trips">
            <TabsList>
              <TabsTrigger value="trips">Trips ({vehicle.trips.length})</TabsTrigger>
              <TabsTrigger value="maintenance">
                Maintenance ({vehicle.maintenanceLogs.length})
              </TabsTrigger>
              <TabsTrigger value="fuel">Fuel ({vehicle.fuelLogs.length})</TabsTrigger>
              <TabsTrigger value="expenses">Expenses ({vehicle.expenses.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({vehicle.documents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="trips" className="mt-3 rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicle.trips.length === 0 ? (
                    <EmptyRow colSpan={6} message="No trips for this vehicle." />
                  ) : (
                    vehicle.trips.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          {t.source} → {t.destination}
                        </TableCell>
                        <TableCell>{t.driver.name}</TableCell>
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
            </TabsContent>

            <TabsContent value="maintenance" className="mt-3 rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Closed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicle.maintenanceLogs.length === 0 ? (
                    <EmptyRow colSpan={6} message="No maintenance records." />
                  ) : (
                    vehicle.maintenanceLogs.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.description}</TableCell>
                        <TableCell>{m.serviceType}</TableCell>
                        <TableCell>{inr(m.cost)}</TableCell>
                        <TableCell>{format(m.openedAt, "dd MMM yyyy")}</TableCell>
                        <TableCell>{m.closedAt ? format(m.closedAt, "dd MMM yyyy") : "—"}</TableCell>
                        <TableCell>
                          <StatusBadge status={m.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="fuel" className="mt-3 rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Liters</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Trip</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicle.fuelLogs.length === 0 ? (
                    <EmptyRow colSpan={4} message="No fuel logs." />
                  ) : (
                    vehicle.fuelLogs.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>{f.liters.toLocaleString()} L</TableCell>
                        <TableCell>{inr(f.cost)}</TableCell>
                        <TableCell>
                          {f.trip ? `${f.trip.source} → ${f.trip.destination}` : "—"}
                        </TableCell>
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
                  {vehicle.expenses.length === 0 ? (
                    <EmptyRow colSpan={4} message="No expenses." />
                  ) : (
                    vehicle.expenses.map((e) => (
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

            <TabsContent value="documents" className="mt-3 space-y-3">
              {canWrite && (
                <div className="flex justify-end">
                  <UploadDocumentDialog vehicleId={vehicle.id} />
                </div>
              )}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="w-0" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicle.documents.length === 0 ? (
                      <EmptyRow colSpan={5} message="No documents uploaded." />
                    ) : (
                      vehicle.documents.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.title}</TableCell>
                          <TableCell>{d.kind}</TableCell>
                          <TableCell>
                            {d.expiryDate ? <ExpiryBadge date={d.expiryDate} /> : "—"}
                          </TableCell>
                          <TableCell>{format(d.uploadedAt, "dd MMM yyyy")}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button variant="ghost" size="icon" aria-label="Download" nativeButton={false} render={<a href={d.filePath} target="_blank" rel="noopener noreferrer" />}>
                              <Download className="h-4 w-4" />
                            </Button>
                            {canWrite && <DeleteDocumentButton id={d.id} vehicleId={vehicle.id} />}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
