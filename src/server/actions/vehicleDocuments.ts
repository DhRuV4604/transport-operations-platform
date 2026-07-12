"use server";

import { revalidatePath } from "next/cache";
import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { DOCUMENT_KINDS } from "@/lib/constants";
import * as vehicleDocumentService from "@/server/services/vehicleDocumentService";
import { type ActionResult, fail } from "./types";

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const metaSchema = z.object({
  vehicleId: z.string().trim().min(1),
  title: z.string().trim().min(1, "Title is required."),
  kind: z.enum(DOCUMENT_KINDS),
  expiryDate: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional()),
});

export async function uploadVehicleDocumentAction(formData: FormData): Promise<ActionResult> {
  try {
    await requirePermission("vehicles.write");

    const parsed = metaSchema.safeParse({
      vehicleId: formData.get("vehicleId"),
      title: formData.get("title"),
      kind: formData.get("kind"),
      expiryDate: formData.get("expiryDate"),
    });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Invalid document data.");
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Please choose a file to upload.");
    }
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      throw new Error("Only PDF, JPG, or PNG files are allowed.");
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error("File must be 5MB or smaller.");
    }

    const storedName = `${randomUUID()}${ext}`;
    await mkdir(UPLOADS_DIR, { recursive: true });
    await writeFile(path.join(UPLOADS_DIR, storedName), Buffer.from(await file.arrayBuffer()));

    await vehicleDocumentService.createVehicleDocument({
      vehicleId: parsed.data.vehicleId,
      title: parsed.data.title,
      kind: parsed.data.kind,
      fileName: file.name,
      filePath: `/uploads/${storedName}`,
      expiryDate: parsed.data.expiryDate ?? null,
    });

    revalidatePath(`/vehicles/${parsed.data.vehicleId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteVehicleDocumentAction(
  id: string,
  vehicleId: string
): Promise<ActionResult> {
  try {
    await requirePermission("vehicles.write");
    const doc = await vehicleDocumentService.deleteVehicleDocument(id);
    await unlink(path.join(process.cwd(), "public", doc.filePath.replace(/^\//, ""))).catch(
      () => {}
    );
    revalidatePath(`/vehicles/${vehicleId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
