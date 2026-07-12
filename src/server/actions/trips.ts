"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import * as tripService from "@/server/services/tripService";
import { type ActionResult, fail } from "./types";

const tripSchema = z.object({
  source: z.string().trim().min(1, "Source is required."),
  destination: z.string().trim().min(1, "Destination is required."),
  vehicleId: z.string().min(1, "Select a vehicle."),
  driverId: z.string().min(1, "Select a driver."),
  cargoWeightKg: z.coerce.number().positive("Cargo weight must be positive."),
  plannedDistanceKm: z.coerce.number().positive("Planned distance must be positive."),
  revenue: z.coerce.number().min(0),
});

const completeSchema = z.object({
  endOdometerKm: z.coerce.number().min(0, "Final odometer is required."),
  fuelLiters: z.coerce.number().min(0),
  fuelCost: z.coerce.number().min(0),
});

function revalidate() {
  revalidatePath("/trips");
  revalidatePath("/vehicles");
  revalidatePath("/drivers");
  revalidatePath("/dashboard");
}

export async function createTripAction(formData: FormData): Promise<ActionResult> {
  try {
    await requirePermission("trips.write");
    const parsed = tripSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid trip data.");
    await tripService.createTrip(parsed.data);
    revalidate();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function dispatchTripAction(tripId: string): Promise<ActionResult> {
  try {
    await requirePermission("trips.write");
    await tripService.dispatchTrip(tripId);
    revalidate();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function completeTripAction(tripId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requirePermission("trips.write");
    const parsed = completeSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid completion data.");
    await tripService.completeTrip(tripId, parsed.data);
    revalidate();
    revalidatePath("/expenses");
    revalidatePath("/reports");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function cancelTripAction(tripId: string): Promise<ActionResult> {
  try {
    await requirePermission("trips.write");
    await tripService.cancelTrip(tripId);
    revalidate();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
