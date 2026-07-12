import { beforeEach, describe, expect, it } from "vitest";
import * as driverService from "@/server/services/driverService";
import { resetDb, makeDriver } from "./helpers";

describe("driverService", () => {
  beforeEach(resetDb);

  it("rejects a duplicate license number on create", async () => {
    await makeDriver({ licenseNumber: "DL-001" });
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    await expect(
      driverService.createDriver({
        name: "Someone Else",
        licenseNumber: "DL-001",
        licenseCategory: "LMV",
        licenseExpiry: future,
        phone: "1234567890",
        safetyScore: 80,
      })
    ).rejects.toThrow(/already exists/i);
  });

  it("blocks changing status of a driver who is currently on a trip", async () => {
    const driver = await makeDriver({ status: "ON_TRIP" });
    await expect(driverService.setDriverStatus(driver.id, "OFF_DUTY")).rejects.toThrow(/on a trip/i);
  });

  it("allows suspending and reinstating an available driver", async () => {
    const driver = await makeDriver({ status: "AVAILABLE" });
    const suspended = await driverService.setDriverStatus(driver.id, "SUSPENDED");
    expect(suspended.status).toBe("SUSPENDED");
    const reinstated = await driverService.setDriverStatus(driver.id, "AVAILABLE");
    expect(reinstated.status).toBe("AVAILABLE");
  });

  it("counts drivers with licenses expired or expiring within 30 days", async () => {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    await makeDriver({ licenseExpiry: new Date(now - 5 * DAY) }); // expired
    await makeDriver({ licenseExpiry: new Date(now + 10 * DAY) }); // expiring soon
    await makeDriver({ licenseExpiry: new Date(now + 200 * DAY) }); // safe

    const drivers = await driverService.getExpiringLicenses();
    expect(drivers).toHaveLength(2);
    const count = await driverService.countExpiringLicenses();
    expect(count).toBe(2);
  });
});
