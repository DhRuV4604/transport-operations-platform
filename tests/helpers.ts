import { db } from "@/lib/db";

/** Wipes every table in FK-safe order so each test starts from a clean slate. */
export async function resetDb() {
  await db.auditEvent.deleteMany();
  await db.vehicleDocument.deleteMany();
  await db.expense.deleteMany();
  await db.fuelLog.deleteMany();
  await db.maintenanceLog.deleteMany();
  await db.trip.deleteMany();
  await db.driver.deleteMany();
  await db.vehicle.deleteMany();
  await db.user.deleteMany();
}

let counter = 0;
function unique(prefix: string) {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function makeVehicle(overrides: Partial<Parameters<typeof db.vehicle.create>[0]["data"]> = {}) {
  return db.vehicle.create({
    data: {
      regNumber: unique("REG"),
      name: "Test Truck",
      type: "TRUCK",
      maxLoadKg: 5000,
      odometerKm: 1000,
      acquisitionCost: 1_000_000,
      region: "WEST",
      status: "AVAILABLE",
      ...overrides,
    },
  });
}

export function makeDriver(overrides: Partial<Parameters<typeof db.driver.create>[0]["data"]> = {}) {
  const future = new Date();
  future.setFullYear(future.getFullYear() + 1);
  return db.driver.create({
    data: {
      name: "Test Driver",
      licenseNumber: unique("LIC"),
      licenseCategory: "HMV",
      licenseExpiry: future,
      phone: "9999999999",
      safetyScore: 80,
      status: "AVAILABLE",
      ...overrides,
    },
  });
}
