import { format } from "date-fns";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { hasPermission, TRIP_STATUS, STATUS_LABELS } from "@/lib/constants";
import { getDispatchableVehicles, getAssignableDrivers } from "@/server/services/tripService";
import { DataTable, type DataRow } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { NewTripDialog, TripRowActions } from "./trip-forms";

export default async function TripsPage() {
  const session = await requireSession();
  const canWrite = hasPermission(session.role, "trips.write");

  const [trips, vehicles, drivers] = await Promise.all([
    db.trip.findMany({
      include: { vehicle: true, driver: true },
      orderBy: { createdAt: "desc" },
    }),
    canWrite ? getDispatchableVehicles() : Promise.resolve([]),
    canWrite ? getAssignableDrivers() : Promise.resolve([]),
  ]);

  const rows: DataRow[] = trips.map((t) => ({
    id: t.id,
    cells: {
      route: {
        value: `${t.source} → ${t.destination}`,
        node: (
          <span className="font-medium">
            {t.source} → {t.destination}
          </span>
        ),
      },
      vehicle: { value: t.vehicle.regNumber },
      driver: { value: t.driver.name },
      cargoWeightKg: { value: t.cargoWeightKg, node: `${t.cargoWeightKg.toLocaleString()} kg` },
      plannedDistanceKm: { value: t.plannedDistanceKm, node: `${t.plannedDistanceKm.toLocaleString()} km` },
      revenue: { value: t.revenue, node: `₹${t.revenue.toLocaleString()}` },
      created: { value: t.createdAt.toISOString(), node: format(t.createdAt, "dd MMM yyyy") },
      status: { value: t.status, node: <StatusBadge status={t.status} /> },
    },
    actions: canWrite ? (
      <TripRowActions trip={{ id: t.id, status: t.status, startOdometerKm: t.startOdometerKm }} />
    ) : undefined,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trips</h1>
          <p className="text-sm text-muted-foreground">Dispatch and monitor deliveries</p>
        </div>
        {canWrite && (
          <NewTripDialog
            vehicles={vehicles.map((v) => ({
              id: v.id,
              regNumber: v.regNumber,
              name: v.name,
              maxLoadKg: v.maxLoadKg,
            }))}
            drivers={drivers.map((d) => ({
              id: d.id,
              name: d.name,
              licenseCategory: d.licenseCategory,
            }))}
          />
        )}
      </div>
      <DataTable
        columns={[
          { key: "route", label: "Route" },
          { key: "vehicle", label: "Vehicle" },
          { key: "driver", label: "Driver" },
          { key: "cargoWeightKg", label: "Cargo" },
          { key: "plannedDistanceKm", label: "Distance" },
          { key: "revenue", label: "Revenue" },
          { key: "created", label: "Created" },
          { key: "status", label: "Status" },
        ]}
        rows={rows}
        filters={[
          { key: "status", label: "Statuses", options: TRIP_STATUS.map((s) => ({ value: s, label: STATUS_LABELS[s] })) },
        ]}
        searchPlaceholder="Search trips…"
        exportHref="/api/export/trips"
        emptyMessage="No trips yet — create one to get started."
      />
    </div>
  );
}
