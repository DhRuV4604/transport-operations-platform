import "server-only";
import { db } from "@/lib/db";

export type VehicleDocumentInput = {
  vehicleId: string;
  title: string;
  kind: string;
  fileName: string;
  filePath: string;
  expiryDate?: Date | null;
};

export async function createVehicleDocument(input: VehicleDocumentInput) {
  return db.vehicleDocument.create({ data: input });
}

export async function deleteVehicleDocument(id: string) {
  return db.vehicleDocument.delete({ where: { id } });
}

function expiringDocumentWhere(days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return { expiryDate: { not: null, lte: cutoff } };
}

export async function countExpiringDocuments(days = 30) {
  return db.vehicleDocument.count({ where: expiringDocumentWhere(days) });
}
