"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { LICENSE_CATEGORIES } from "@/lib/constants";
import * as driverService from "@/server/services/driverService";
import {
  sendLicenseReminders,
  type LicenseReminderResult,
} from "@/server/services/licenseReminderService";
import { logAuditEvent } from "@/server/services/auditService";
import { type ActionResult, fail } from "./types";

const driverSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  licenseNumber: z.string().trim().min(1, "License number is required."),
  licenseCategory: z.enum(LICENSE_CATEGORIES),
  licenseExpiry: z.coerce.date(),
  phone: z.string().trim().min(1, "Contact number is required."),
  safetyScore: z.coerce.number().int().min(0).max(100),
});

function parseDriver(formData: FormData) {
  const parsed = driverSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid driver data.");
  }
  return parsed.data;
}

export async function createDriverAction(formData: FormData): Promise<ActionResult> {
  try {
    await requirePermission("drivers.write");
    await driverService.createDriver(parseDriver(formData));
    revalidatePath("/drivers");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateDriverAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requirePermission("drivers.write");
    await driverService.updateDriver(id, parseDriver(formData));
    revalidatePath("/drivers");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setDriverStatusAction(
  id: string,
  status: "AVAILABLE" | "OFF_DUTY" | "SUSPENDED"
): Promise<ActionResult> {
  try {
    const session = await requirePermission("drivers.write");
    const driver = await driverService.setDriverStatus(id, status);
    if (status === "SUSPENDED" || status === "AVAILABLE") {
      await logAuditEvent(session, {
        action: status === "SUSPENDED" ? "DRIVER_SUSPENDED" : "DRIVER_REINSTATED",
        entityType: "DRIVER",
        entityId: driver.id,
        entityLabel: driver.name,
      });
    }
    revalidatePath("/drivers");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function sendLicenseRemindersAction(): Promise<
  ({ ok: true } & LicenseReminderResult) | { ok: false; error: string }
> {
  try {
    await requirePermission("drivers.write");
    const result = await sendLicenseReminders();
    revalidatePath("/drivers");
    return { ok: true, ...result };
  } catch (e) {
    const fallback = fail(e);
    return fallback as { ok: false; error: string };
  }
}
