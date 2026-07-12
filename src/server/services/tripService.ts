import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type Tx = Prisma.TransactionClient;

export type TripInput = {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  revenue: number;
};

/** Vehicles eligible for dispatch: Available only (never Retired / In Shop / On Trip). */
export function getDispatchableVehicles() {
  return db.vehicle.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { regNumber: "asc" },
  });
}

/** Drivers eligible for assignment: Available with a valid (unexpired) license. */
export function getAssignableDrivers() {
  return db.driver.findMany({
    where: { status: "AVAILABLE", licenseExpiry: { gt: new Date() } },
    orderBy: { name: "asc" },
  });
}

async function assertVehicleAssignable(tx: Tx, vehicleId: string, cargoWeightKg: number) {
  const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new Error("Vehicle not found.");
  if (vehicle.status !== "AVAILABLE") {
    throw new Error(`Vehicle ${vehicle.regNumber} is not available (currently ${vehicle.status.replace("_", " ").toLowerCase()}).`);
  }
  if (cargoWeightKg > vehicle.maxLoadKg) {
    throw new Error(
      `Cargo weight ${cargoWeightKg} kg exceeds ${vehicle.regNumber}'s maximum load capacity of ${vehicle.maxLoadKg} kg.`
    );
  }
  return vehicle;
}

async function assertDriverAssignable(tx: Tx, driverId: string) {
  const driver = await tx.driver.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error("Driver not found.");
  if (driver.status === "SUSPENDED") throw new Error(`Driver ${driver.name} is suspended and cannot be assigned.`);
  if (driver.status !== "AVAILABLE") {
    throw new Error(`Driver ${driver.name} is not available (currently ${driver.status.replace("_", " ").toLowerCase()}).`);
  }
  if (driver.licenseExpiry <= new Date()) {
    throw new Error(`Driver ${driver.name}'s license has expired and cannot be assigned to trips.`);
  }
  return driver;
}

export function createTrip(input: TripInput) {
  return db.$transaction(async (tx) => {
    await assertVehicleAssignable(tx, input.vehicleId, input.cargoWeightKg);
    await assertDriverAssignable(tx, input.driverId);
    return tx.trip.create({ data: { ...input, status: "DRAFT" } });
  });
}

/** Dispatch: re-validates everything, then atomically sets trip/vehicle/driver state. */
export function dispatchTrip(tripId: string) {
  return db.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error("Trip not found.");
    if (trip.status !== "DRAFT") throw new Error("Only draft trips can be dispatched.");

    const vehicle = await assertVehicleAssignable(tx, trip.vehicleId, trip.cargoWeightKg);
    await assertDriverAssignable(tx, trip.driverId);

    await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "ON_TRIP" } });
    await tx.driver.update({ where: { id: trip.driverId }, data: { status: "ON_TRIP" } });
    return tx.trip.update({
      where: { id: tripId },
      data: { status: "DISPATCHED", dispatchedAt: new Date(), startOdometerKm: vehicle.odometerKm },
    });
  });
}

/** Complete: records final odometer + fuel, frees vehicle & driver. */
export function completeTrip(
  tripId: string,
  data: { endOdometerKm: number; fuelLiters: number; fuelCost: number }
) {
  return db.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error("Trip not found.");
    if (trip.status !== "DISPATCHED") throw new Error("Only dispatched trips can be completed.");
    if (trip.startOdometerKm != null && data.endOdometerKm < trip.startOdometerKm) {
      throw new Error(
        `Final odometer (${data.endOdometerKm} km) cannot be less than the start odometer (${trip.startOdometerKm} km).`
      );
    }

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "AVAILABLE", odometerKm: data.endOdometerKm },
    });
    await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });

    if (data.fuelLiters > 0) {
      await tx.fuelLog.create({
        data: {
          vehicleId: trip.vehicleId,
          tripId: trip.id,
          liters: data.fuelLiters,
          cost: data.fuelCost,
        },
      });
    }

    return tx.trip.update({
      where: { id: tripId },
      data: { status: "COMPLETED", completedAt: new Date(), endOdometerKm: data.endOdometerKm },
    });
  });
}

/** Cancel: a dispatched trip frees its vehicle & driver; a draft just flips status. */
export function cancelTrip(tripId: string) {
  return db.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error("Trip not found.");
    if (trip.status !== "DRAFT" && trip.status !== "DISPATCHED") {
      throw new Error("Only draft or dispatched trips can be cancelled.");
    }

    if (trip.status === "DISPATCHED") {
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
    }

    return tx.trip.update({ where: { id: tripId }, data: { status: "CANCELLED" } });
  });
}
