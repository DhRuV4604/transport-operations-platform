"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { LICENSE_CATEGORIES } from "@/lib/constants";
import * as driverService from "@/server/services/driverService";
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
    await requirePermission("drivers.write");
    await driverService.setDriverStatus(id, status);
    revalidatePath("/drivers");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
