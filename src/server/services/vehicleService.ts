import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type VehicleInput = {
  regNumber: string;
  name: string;
  type: string;
  maxLoadKg: number;
  odometerKm: number;
  acquisitionCost: number;
  region: string;
};

function rethrowUniqueReg(e: unknown): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    throw new Error("A vehicle with this registration number already exists.");
  }
  throw e;
}

export async function createVehicle(input: VehicleInput) {
  try {
    return await db.vehicle.create({ data: input });
  } catch (e) {
    rethrowUniqueReg(e);
  }
}

export async function updateVehicle(id: string, input: VehicleInput) {
  try {
    return await db.vehicle.update({ where: { id }, data: input });
  } catch (e) {
    rethrowUniqueReg(e);
  }
}

export async function retireVehicle(id: string) {
  return db.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id } });
    if (vehicle.status === "ON_TRIP") {
      throw new Error("Cannot retire a vehicle that is currently on a trip.");
    }
    return tx.vehicle.update({ where: { id }, data: { status: "RETIRED" } });
  });
}
