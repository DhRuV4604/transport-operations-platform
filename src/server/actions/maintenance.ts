"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { SERVICE_TYPES } from "@/lib/constants";
import * as maintenanceService from "@/server/services/maintenanceService";
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
    await requirePermission("maintenance.write");
    const parsed = maintenanceSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid maintenance data.");
    await maintenanceService.openMaintenance(parsed.data);
    revalidate();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function closeMaintenanceAction(logId: string): Promise<ActionResult> {
  try {
    await requirePermission("maintenance.write");
    await maintenanceService.closeMaintenance(logId);
    revalidate();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
