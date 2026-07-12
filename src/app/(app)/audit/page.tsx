import { format } from "date-fns";
import { requireSession } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { listAuditEvents } from "@/server/services/auditService";
import { DataTable, type DataRow } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

const ACTION_LABELS: Record<string, string> = {
  VEHICLE_RETIRED: "Vehicle retired",
  DRIVER_SUSPENDED: "Driver suspended",
  DRIVER_REINSTATED: "Driver reinstated",
  TRIP_DISPATCHED: "Trip dispatched",
  TRIP_COMPLETED: "Trip completed",
  TRIP_CANCELLED: "Trip cancelled",
  MAINTENANCE_OPENED: "Maintenance opened",
  MAINTENANCE_CLOSED: "Maintenance closed",
};

export default async function AuditLogPage() {
  await requireSession();
  const events = await listAuditEvents();

  const rows: DataRow[] = events.map((e) => ({
    id: e.id,
    cells: {
      when: {
        value: e.createdAt.toISOString(),
        node: format(e.createdAt, "dd MMM yyyy, HH:mm"),
      },
      actor: {
        value: e.actorName,
        node: (
          <span className="flex items-center gap-2">
            {e.actorName}
            <Badge variant="secondary" className="text-xs">
              {ROLE_LABELS[e.actorRole as keyof typeof ROLE_LABELS] ?? e.actorRole}
            </Badge>
          </span>
        ),
      },
      action: { value: e.action, node: ACTION_LABELS[e.action] ?? e.action },
      entityType: { value: e.entityType },
      entityLabel: { value: e.entityLabel, node: <span className="font-medium">{e.entityLabel}</span> },
    },
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Who dispatched, retired, or suspended what, and when
        </p>
      </div>
      <DataTable
        columns={[
          { key: "when", label: "When" },
          { key: "actor", label: "Actor" },
          { key: "action", label: "Action" },
          { key: "entityType", label: "Entity Type" },
          { key: "entityLabel", label: "Entity" },
        ]}
        rows={rows}
        searchPlaceholder="Search audit log…"
        emptyMessage="No events recorded yet."
      />
    </div>
  );
}
