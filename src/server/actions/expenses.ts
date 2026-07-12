"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { type ActionResult, fail } from "./types";

const fuelSchema = z.object({
  vehicleId: z.string().min(1, "Select a vehicle."),
  liters: z.coerce.number().positive("Liters must be positive."),
  cost: z.coerce.number().min(0),
  date: z.coerce.date(),
});

const expenseSchema = z.object({
  vehicleId: z.string().optional(),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive("Amount must be positive."),
  description: z.string().trim().min(1, "Description is required."),
  date: z.coerce.date(),
});

function revalidate() {
  revalidatePath("/expenses");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
}

export async function addFuelLogAction(formData: FormData): Promise<ActionResult> {
  try {
    await requirePermission("expenses.write");
    const parsed = fuelSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid fuel log.");
    await db.fuelLog.create({ data: parsed.data });
    revalidate();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function addExpenseAction(formData: FormData): Promise<ActionResult> {
  try {
    await requirePermission("expenses.write");
    const raw = Object.fromEntries(formData);
    const parsed = expenseSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid expense.");
    const { vehicleId, ...rest } = parsed.data;
    await db.expense.create({
      data: { ...rest, vehicleId: vehicleId && vehicleId !== "none" ? vehicleId : null },
    });
    revalidate();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
