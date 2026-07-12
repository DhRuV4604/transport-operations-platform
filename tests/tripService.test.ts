import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import * as tripService from "@/server/services/tripService";
import { resetDb, makeVehicle, makeDriver } from "./helpers";

const baseTrip = {
  source: "Mumbai",
  destination: "Pune",
  cargoWeightKg: 1000,
  plannedDistanceKm: 150,
  revenue: 20_000,
};

describe("tripService", () => {
  beforeEach(resetDb);

  it("rejects trip creation when cargo exceeds the vehicle's max load", async () => {
    const vehicle = await makeVehicle({ maxLoadKg: 500 });
    const driver = await makeDriver();
    await expect(
      tripService.createTrip({ ...baseTrip, vehicleId: vehicle.id, driverId: driver.id })
    ).rejects.toThrow(/exceeds/i);
  });

  it("rejects trip creation when the vehicle is not available", async () => {
    const vehicle = await makeVehicle({ status: "IN_SHOP" });
    const driver = await makeDriver();
    await expect(
      tripService.createTrip({ ...baseTrip, vehicleId: vehicle.id, driverId: driver.id })
    ).rejects.toThrow(/not available/i);
  });

  it("rejects trip creation when the driver's license has expired", async () => {
    const vehicle = await makeVehicle();
    const driver = await makeDriver({ licenseExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000) });
    await expect(
      tripService.createTrip({ ...baseTrip, vehicleId: vehicle.id, driverId: driver.id })
    ).rejects.toThrow(/license has expired/i);
  });

  it("rejects trip creation when the driver is suspended", async () => {
    const vehicle = await makeVehicle();
    const driver = await makeDriver({ status: "SUSPENDED" });
    await expect(
      tripService.createTrip({ ...baseTrip, vehicleId: vehicle.id, driverId: driver.id })
    ).rejects.toThrow(/suspended/i);
  });

  it("dispatches a draft trip atomically: vehicle and driver flip to on-trip, start odometer recorded", async () => {
    const vehicle = await makeVehicle({ odometerKm: 5000 });
    const driver = await makeDriver();
    const trip = await tripService.createTrip({ ...baseTrip, vehicleId: vehicle.id, driverId: driver.id });

    const dispatched = await tripService.dispatchTrip(trip.id);
    expect(dispatched.status).toBe("DISPATCHED");
    expect(dispatched.startOdometerKm).toBe(5000);

    const [updatedVehicle, updatedDriver] = await Promise.all([
      db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } }),
      db.driver.findUniqueOrThrow({ where: { id: driver.id } }),
    ]);
    expect(updatedVehicle.status).toBe("ON_TRIP");
    expect(updatedDriver.status).toBe("ON_TRIP");
  });

  it("rejects dispatching a trip that isn't in draft status", async () => {
    const vehicle = await makeVehicle();
    const driver = await makeDriver();
    const trip = await tripService.createTrip({ ...baseTrip, vehicleId: vehicle.id, driverId: driver.id });
    await tripService.dispatchTrip(trip.id);
    await expect(tripService.dispatchTrip(trip.id)).rejects.toThrow(/only draft trips/i);
  });

  it("rejects completing a trip with an end odometer below the start odometer", async () => {
    const vehicle = await makeVehicle({ odometerKm: 5000 });
    const driver = await makeDriver();
    const trip = await tripService.createTrip({ ...baseTrip, vehicleId: vehicle.id, driverId: driver.id });
    await tripService.dispatchTrip(trip.id);

    await expect(
      tripService.completeTrip(trip.id, { endOdometerKm: 4000, fuelLiters: 10, fuelCost: 900 })
    ).rejects.toThrow(/cannot be less than/i);
  });

  it("completes a dispatched trip: frees vehicle/driver, updates odometer, logs fuel", async () => {
    const vehicle = await makeVehicle({ odometerKm: 5000 });
    const driver = await makeDriver();
    const trip = await tripService.createTrip({ ...baseTrip, vehicleId: vehicle.id, driverId: driver.id });
    await tripService.dispatchTrip(trip.id);

    const completed = await tripService.completeTrip(trip.id, {
      endOdometerKm: 5150,
      fuelLiters: 12,
      fuelCost: 1100,
    });
    expect(completed.status).toBe("COMPLETED");
    expect(completed.endOdometerKm).toBe(5150);

    const [updatedVehicle, updatedDriver, fuelLogs] = await Promise.all([
      db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } }),
      db.driver.findUniqueOrThrow({ where: { id: driver.id } }),
      db.fuelLog.findMany({ where: { tripId: trip.id } }),
    ]);
    expect(updatedVehicle.status).toBe("AVAILABLE");
    expect(updatedVehicle.odometerKm).toBe(5150);
    expect(updatedDriver.status).toBe("AVAILABLE");
    expect(fuelLogs).toHaveLength(1);
    expect(fuelLogs[0].liters).toBe(12);
  });

  it("cancelling a dispatched trip frees the vehicle and driver", async () => {
    const vehicle = await makeVehicle();
    const driver = await makeDriver();
    const trip = await tripService.createTrip({ ...baseTrip, vehicleId: vehicle.id, driverId: driver.id });
    await tripService.dispatchTrip(trip.id);

    const cancelled = await tripService.cancelTrip(trip.id);
    expect(cancelled.status).toBe("CANCELLED");

    const [updatedVehicle, updatedDriver] = await Promise.all([
      db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } }),
      db.driver.findUniqueOrThrow({ where: { id: driver.id } }),
    ]);
    expect(updatedVehicle.status).toBe("AVAILABLE");
    expect(updatedDriver.status).toBe("AVAILABLE");
  });

  it("rejects cancelling a trip that is already completed", async () => {
    const vehicle = await makeVehicle();
    const driver = await makeDriver();
    const trip = await tripService.createTrip({ ...baseTrip, vehicleId: vehicle.id, driverId: driver.id });
    await tripService.dispatchTrip(trip.id);
    await tripService.completeTrip(trip.id, { endOdometerKm: 5100, fuelLiters: 0, fuelCost: 0 });

    await expect(tripService.cancelTrip(trip.id)).rejects.toThrow(/only draft or dispatched/i);
  });
});
