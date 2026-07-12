import Link from "next/link";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { hasPermission, DRIVER_STATUS, LICENSE_CATEGORIES, STATUS_LABELS } from "@/lib/constants";
import { DataTable, type DataRow } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { ExpiryBadge } from "@/components/expiry-badge";
import { AddDriverDialog, DriverRowActions, SendRemindersButton, type DriverDto } from "./driver-forms";

export default async function DriversPage() {
  const session = await requireSession();
  const canWrite = hasPermission(session.role, "drivers.write");
  const drivers = await db.driver.findMany({ orderBy: { createdAt: "desc" } });

  const rows: DataRow[] = drivers.map((d) => {
    const dto: DriverDto = {
      id: d.id,
      name: d.name,
      licenseNumber: d.licenseNumber,
      licenseCategory: d.licenseCategory,
      licenseExpiry: format(d.licenseExpiry, "yyyy-MM-dd"),
      phone: d.phone,
      safetyScore: d.safetyScore,
      status: d.status,
    };
    return {
      id: d.id,
      cells: {
        name: {
          value: d.name,
          node: (
            <Link href={`/drivers/${d.id}`} className="font-medium underline-offset-4 hover:underline">
              {d.name}
            </Link>
          ),
        },
        licenseNumber: { value: d.licenseNumber },
        licenseCategory: { value: d.licenseCategory },
        licenseExpiry: {
          value: d.licenseExpiry.toISOString(),
          node: <ExpiryBadge date={d.licenseExpiry} />,
        },
        phone: { value: d.phone },
        safetyScore: {
          value: d.safetyScore,
          node: (
            <span className={d.safetyScore < 60 ? "text-red-600 dark:text-red-400 font-medium" : ""}>
              {d.safetyScore}
            </span>
          ),
        },
        status: { value: d.status, node: <StatusBadge status={d.status} /> },
      },
      actions: canWrite ? <DriverRowActions driver={dto} /> : undefined,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Drivers</h1>
          <p className="text-sm text-muted-foreground">Profiles, licenses and safety compliance</p>
        </div>
        {canWrite && (
          <div className="flex items-center gap-2">
            <SendRemindersButton />
            <AddDriverDialog />
          </div>
        )}
      </div>
      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "licenseNumber", label: "License No." },
          { key: "licenseCategory", label: "Category" },
          { key: "licenseExpiry", label: "License Expiry" },
          { key: "phone", label: "Contact" },
          { key: "safetyScore", label: "Safety Score" },
          { key: "status", label: "Status" },
        ]}
        rows={rows}
        filters={[
          { key: "status", label: "Statuses", options: DRIVER_STATUS.map((s) => ({ value: s, label: STATUS_LABELS[s] })) },
          { key: "licenseCategory", label: "Categories", options: LICENSE_CATEGORIES.map((c) => ({ value: c, label: c })) },
        ]}
        searchPlaceholder="Search drivers…"
        exportHref="/api/export/drivers"
        emptyMessage="No drivers yet."
      />
    </div>
  );
}
