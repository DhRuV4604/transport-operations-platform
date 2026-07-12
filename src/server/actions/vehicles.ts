"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { VEHICLE_TYPES, REGIONS } from "@/lib/constants";
import * as vehicleService from "@/server/services/vehicleService";
import { type ActionResult, fail } from "./types";

const vehicleSchema = z.object({
  regNumber: z.string().trim().min(1, "Registration number is required."),
  name: z.string().trim().min(1, "Vehicle name/model is required."),
  type: z.enum(VEHICLE_TYPES),
  maxLoadKg: z.coerce.number().positive("Max load must be positive."),
  odometerKm: z.coerce.number().min(0),
  acquisitionCost: z.coerce.number().min(0),
  region: z.enum(REGIONS),
});

function parseVehicle(formData: FormData) {
  const parsed = vehicleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid vehicle data.");
  }
  return parsed.data;
}

export async function createVehicleAction(formData: FormData): Promise<ActionResult> {
  try {
    await requirePermission("vehicles.write");
    await vehicleService.createVehicle(parseVehicle(formData));
    revalidatePath("/vehicles");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateVehicleAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requirePermission("vehicles.write");
    await vehicleService.updateVehicle(id, parseVehicle(formData));
    revalidatePath("/vehicles");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function retireVehicleAction(id: string): Promise<ActionResult> {
  try {
    await requirePermission("vehicles.write");
    await vehicleService.retireVehicle(id);
    revalidatePath("/vehicles");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
