import "server-only";
import { db } from "@/lib/db";

export type MaintenanceInput = {
  vehicleId: string;
  description: string;
  serviceType: string;
  cost: number;
};

/** Opening maintenance pulls the vehicle out of the dispatch pool (status → In Shop). */
export function openMaintenance(input: MaintenanceInput) {
  return db.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw new Error("Vehicle not found.");
    if (vehicle.status === "ON_TRIP") {
      throw new Error(`Vehicle ${vehicle.regNumber} is on a trip — complete or cancel the trip first.`);
    }
    if (vehicle.status !== "RETIRED") {
      await tx.vehicle.update({ where: { id: input.vehicleId }, data: { status: "IN_SHOP" } });
    }
    return tx.maintenanceLog.create({ data: { ...input, status: "OPEN" } });
  });
}

/** Closing maintenance restores the vehicle to Available (unless retired or still in another open job). */
export function closeMaintenance(logId: string) {
  return db.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.findUnique({ where: { id: logId }, include: { vehicle: true } });
    if (!log) throw new Error("Maintenance record not found.");
    if (log.status !== "OPEN") throw new Error("This maintenance record is already closed.");

    const updated = await tx.maintenanceLog.update({
      where: { id: logId },
      data: { status: "CLOSED", closedAt: new Date() },
    });

    const otherOpen = await tx.maintenanceLog.count({
      where: { vehicleId: log.vehicleId, status: "OPEN" },
    });
    if (otherOpen === 0 && log.vehicle.status === "IN_SHOP") {
      await tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: "AVAILABLE" } });
    }
    return updated;
  });
}
