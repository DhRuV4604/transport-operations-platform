import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { hasPermission, VEHICLE_STATUS, VEHICLE_TYPES, REGIONS, STATUS_LABELS } from "@/lib/constants";
import { DataTable, type DataRow } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { AddVehicleDialog, VehicleRowActions, type VehicleDto } from "./vehicle-forms";

export default async function VehiclesPage() {
  const session = await requireSession();
  const canWrite = hasPermission(session.role, "vehicles.write");
  const vehicles = await db.vehicle.findMany({ orderBy: { createdAt: "desc" } });

  const rows: DataRow[] = vehicles.map((v) => {
    const dto: VehicleDto = {
      id: v.id,
      regNumber: v.regNumber,
      name: v.name,
      type: v.type,
      maxLoadKg: v.maxLoadKg,
      odometerKm: v.odometerKm,
      acquisitionCost: v.acquisitionCost,
      region: v.region,
      status: v.status,
    };
    return {
      id: v.id,
      cells: {
        regNumber: {
          value: v.regNumber,
          node: (
            <Link href={`/vehicles/${v.id}`} className="font-medium underline-offset-4 hover:underline">
              {v.regNumber}
            </Link>
          ),
        },
        name: { value: v.name },
        type: { value: v.type },
        maxLoadKg: { value: v.maxLoadKg, node: `${v.maxLoadKg.toLocaleString()} kg` },
        odometerKm: { value: v.odometerKm, node: `${v.odometerKm.toLocaleString()} km` },
        region: { value: v.region },
        status: { value: v.status, node: <StatusBadge status={v.status} /> },
      },
      actions: canWrite ? <VehicleRowActions vehicle={dto} /> : undefined,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-sm text-muted-foreground">Fleet registry and lifecycle</p>
        </div>
        {canWrite && <AddVehicleDialog />}
      </div>
      <DataTable
        columns={[
          { key: "regNumber", label: "Registration" },
          { key: "name", label: "Name / Model" },
          { key: "type", label: "Type" },
          { key: "maxLoadKg", label: "Max Load" },
          { key: "odometerKm", label: "Odometer" },
          { key: "region", label: "Region" },
          { key: "status", label: "Status" },
        ]}
        rows={rows}
        filters={[
          { key: "type", label: "Types", options: VEHICLE_TYPES.map((t) => ({ value: t, label: t })) },
          { key: "status", label: "Statuses", options: VEHICLE_STATUS.map((s) => ({ value: s, label: STATUS_LABELS[s] })) },
          { key: "region", label: "Regions", options: REGIONS.map((r) => ({ value: r, label: r })) },
        ]}
        searchPlaceholder="Search vehicles…"
        exportHref="/api/export/vehicles"
        emptyMessage="No vehicles registered yet."
      />
    </div>
  );
}
