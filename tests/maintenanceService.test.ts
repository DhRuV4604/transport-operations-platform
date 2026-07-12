import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import * as maintenanceService from "@/server/services/maintenanceService";
import { resetDb, makeVehicle } from "./helpers";

describe("maintenanceService", () => {
  beforeEach(resetDb);

  it("opening a job pulls the vehicle into In Shop", async () => {
    const vehicle = await makeVehicle({ status: "AVAILABLE" });
    await maintenanceService.openMaintenance({
      vehicleId: vehicle.id,
      description: "Brake check",
      serviceType: "ROUTINE",
      cost: 2000,
    });
    const updated = await db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
    expect(updated.status).toBe("IN_SHOP");
  });

  it("blocks opening a maintenance job for a vehicle on a trip", async () => {
    const vehicle = await makeVehicle({ status: "ON_TRIP" });
    await expect(
      maintenanceService.openMaintenance({
        vehicleId: vehicle.id,
        description: "Brake check",
        serviceType: "ROUTINE",
        cost: 2000,
      })
    ).rejects.toThrow(/on a trip/i);
  });

  it("closing the only open job restores the vehicle to Available", async () => {
    const vehicle = await makeVehicle({ status: "AVAILABLE" });
    const log = await maintenanceService.openMaintenance({
      vehicleId: vehicle.id,
      description: "Brake check",
      serviceType: "ROUTINE",
      cost: 2000,
    });
    await maintenanceService.closeMaintenance(log.id);
    const updated = await db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
    expect(updated.status).toBe("AVAILABLE");
  });

  it("closing one of several open jobs keeps the vehicle In Shop until the last is closed", async () => {
    const vehicle = await makeVehicle({ status: "AVAILABLE" });
    const first = await maintenanceService.openMaintenance({
      vehicleId: vehicle.id,
      description: "Brake check",
      serviceType: "ROUTINE",
      cost: 2000,
    });
    const second = await maintenanceService.openMaintenance({
      vehicleId: vehicle.id,
      description: "Engine repair",
      serviceType: "REPAIR",
      cost: 8000,
    });

    await maintenanceService.closeMaintenance(first.id);
    let updated = await db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
    expect(updated.status).toBe("IN_SHOP");

    await maintenanceService.closeMaintenance(second.id);
    updated = await db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
    expect(updated.status).toBe("AVAILABLE");
  });

  it("rejects closing an already-closed maintenance record", async () => {
    const vehicle = await makeVehicle({ status: "AVAILABLE" });
    const log = await maintenanceService.openMaintenance({
      vehicleId: vehicle.id,
      description: "Brake check",
      serviceType: "ROUTINE",
      cost: 2000,
    });
    await maintenanceService.closeMaintenance(log.id);
    await expect(maintenanceService.closeMaintenance(log.id)).rejects.toThrow(/already closed/i);
  });
});
