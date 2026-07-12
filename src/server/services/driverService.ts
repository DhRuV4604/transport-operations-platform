import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type DriverInput = {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: Date;
  phone: string;
  safetyScore: number;
};

function rethrowUniqueLicense(e: unknown): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    throw new Error("A driver with this license number already exists.");
  }
  throw e;
}

export async function createDriver(input: DriverInput) {
  try {
    return await db.driver.create({ data: input });
  } catch (e) {
    rethrowUniqueLicense(e);
  }
}

export async function updateDriver(id: string, input: DriverInput) {
  try {
    return await db.driver.update({ where: { id }, data: input });
  } catch (e) {
    rethrowUniqueLicense(e);
  }
}

export async function setDriverStatus(id: string, status: "AVAILABLE" | "OFF_DUTY" | "SUSPENDED") {
  return db.$transaction(async (tx) => {
    const driver = await tx.driver.findUniqueOrThrow({ where: { id } });
    if (driver.status === "ON_TRIP") {
      throw new Error("Cannot change status of a driver who is currently on a trip.");
    }
    return tx.driver.update({ where: { id }, data: { status } });
  });
}

/** Drivers whose license has already expired or expires within `days`. */
function expiringLicenseWhere(days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return { licenseExpiry: { lte: cutoff } };
}

export async function getExpiringLicenses(days = 30) {
  return db.driver.findMany({
    where: expiringLicenseWhere(days),
    orderBy: { licenseExpiry: "asc" },
  });
}

export async function countExpiringLicenses(days = 30) {
  return db.driver.count({ where: expiringLicenseWhere(days) });
}
