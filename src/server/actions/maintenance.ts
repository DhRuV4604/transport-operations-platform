"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { SERVICE_TYPES } from "@/lib/constants";
import { db } from "@/lib/db";
import * as maintenanceService from "@/server/services/maintenanceService";
import { logAuditEvent } from "@/server/services/auditService";
import { type ActionResult, fail } from "./types";

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Select a vehicle."),
  description: z.string().trim().min(1, "Description is required."),
  serviceType: z.enum(SERVICE_TYPES),
  cost: z.coerce.number().min(0),
});

function revalidate() {
  revalidatePath("/maintenance");
  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function openMaintenanceAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requirePermission("maintenance.write");
    const parsed = maintenanceSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid maintenance data.");
    const log = await maintenanceService.openMaintenance(parsed.data);
    const vehicle = await db.vehicle.findUniqueOrThrow({ where: { id: parsed.data.vehicleId } });
    await logAuditEvent(session, {
      action: "MAINTENANCE_OPENED",
      entityType: "MAINTENANCE",
      entityId: log.id,
      entityLabel: `${vehicle.regNumber} — ${log.description}`,
    });
    revalidate();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function closeMaintenanceAction(logId: string): Promise<ActionResult> {
  try {
    const session = await requirePermission("maintenance.write");
    const log = await maintenanceService.closeMaintenance(logId);
    const vehicle = await db.vehicle.findUniqueOrThrow({ where: { id: log.vehicleId } });
    await logAuditEvent(session, {
      action: "MAINTENANCE_CLOSED",
      entityType: "MAINTENANCE",
      entityId: log.id,
      entityLabel: `${vehicle.regNumber} — ${log.description}`,
    });
    revalidate();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
