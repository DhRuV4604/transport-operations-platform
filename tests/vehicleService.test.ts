import { beforeEach, describe, expect, it } from "vitest";
import * as vehicleService from "@/server/services/vehicleService";
import { resetDb, makeVehicle } from "./helpers";

describe("vehicleService", () => {
  beforeEach(resetDb);

  it("rejects a duplicate registration number on create", async () => {
    await makeVehicle({ regNumber: "MH-01-AB-1234" });
    await expect(
      vehicleService.createVehicle({
        regNumber: "MH-01-AB-1234",
        name: "Duplicate",
        type: "VAN",
        maxLoadKg: 1000,
        odometerKm: 0,
        acquisitionCost: 500_000,
        region: "NORTH",
      })
    ).rejects.toThrow(/already exists/i);
  });

  it("rejects a duplicate registration number on update", async () => {
    await makeVehicle({ regNumber: "MH-01-AB-1234" });
    const other = await makeVehicle({ regNumber: "MH-02-CD-5678" });
    await expect(
      vehicleService.updateVehicle(other.id, {
        regNumber: "MH-01-AB-1234",
        name: other.name,
        type: other.type,
        maxLoadKg: other.maxLoadKg,
        odometerKm: other.odometerKm,
        acquisitionCost: other.acquisitionCost,
        region: other.region,
      })
    ).rejects.toThrow(/already exists/i);
  });

  it("blocks retiring a vehicle that is currently on a trip", async () => {
    const vehicle = await makeVehicle({ status: "ON_TRIP" });
    await expect(vehicleService.retireVehicle(vehicle.id)).rejects.toThrow(/on a trip/i);
  });

  it("allows retiring a vehicle that is not on a trip", async () => {
    const vehicle = await makeVehicle({ status: "AVAILABLE" });
    const retired = await vehicleService.retireVehicle(vehicle.id);
    expect(retired.status).toBe("RETIRED");
  });
});
