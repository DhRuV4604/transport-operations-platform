import { format } from "date-fns";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { hasPermission, SERVICE_TYPES, MAINTENANCE_STATUS, STATUS_LABELS } from "@/lib/constants";
import { DataTable, type DataRow } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { NewMaintenanceDialog, CloseMaintenanceButton } from "./maintenance-forms";

export default async function MaintenancePage() {
  const session = await requireSession();
  const canWrite = hasPermission(session.role, "maintenance.write");

  const [logs, vehicles] = await Promise.all([
    db.maintenanceLog.findMany({ include: { vehicle: true }, orderBy: { openedAt: "desc" } }),
    canWrite
      ? db.vehicle.findMany({
          where: { status: { notIn: ["RETIRED", "ON_TRIP"] } },
          orderBy: { regNumber: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const rows: DataRow[] = logs.map((l) => ({
    id: l.id,
    cells: {
      vehicle: { value: l.vehicle.regNumber, node: <span className="font-medium">{l.vehicle.regNumber}</span> },
      description: { value: l.description },
      serviceType: { value: l.serviceType },
      cost: { value: l.cost, node: `₹${l.cost.toLocaleString()}` },
      openedAt: { value: l.openedAt.toISOString(), node: format(l.openedAt, "dd MMM yyyy") },
      closedAt: {
        value: l.closedAt?.toISOString() ?? "",
        node: l.closedAt ? format(l.closedAt, "dd MMM yyyy") : "—",
      },
      status: { value: l.status, node: <StatusBadge status={l.status} /> },
    },
    actions: canWrite && l.status === "OPEN" ? <CloseMaintenanceButton logId={l.id} /> : undefined,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            Opening a record moves the vehicle to “In Shop”; closing restores it to Available.
          </p>
        </div>
        {canWrite && (
          <NewMaintenanceDialog
            vehicles={vehicles.map((v) => ({
              id: v.id,
              regNumber: v.regNumber,
              name: v.name,
              status: v.status,
            }))}
          />
        )}
      </div>
      <DataTable
        columns={[
          { key: "vehicle", label: "Vehicle" },
          { key: "description", label: "Description" },
          { key: "serviceType", label: "Type" },
          { key: "cost", label: "Cost" },
          { key: "openedAt", label: "Opened" },
          { key: "closedAt", label: "Closed" },
          { key: "status", label: "Status" },
        ]}
        rows={rows}
        filters={[
          { key: "status", label: "Statuses", options: MAINTENANCE_STATUS.map((s) => ({ value: s, label: STATUS_LABELS[s] })) },
          { key: "serviceType", label: "Types", options: SERVICE_TYPES.map((s) => ({ value: s, label: s })) },
        ]}
        searchPlaceholder="Search maintenance…"
        emptyMessage="No maintenance records."
      />
    </div>
  );
}
