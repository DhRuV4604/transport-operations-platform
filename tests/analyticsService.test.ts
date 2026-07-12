import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import * as analyticsService from "@/server/services/analyticsService";
import * as tripService from "@/server/services/tripService";
import { resetDb, makeVehicle, makeDriver } from "./helpers";

describe("analyticsService", () => {
  beforeEach(resetDb);

  it("getKpis reports fleet status counts and utilization respecting filters", async () => {
    await makeVehicle({ status: "AVAILABLE", type: "TRUCK" });
    await makeVehicle({ status: "ON_TRIP", type: "TRUCK" });
    await makeVehicle({ status: "IN_SHOP", type: "VAN" });

    const kpis = await analyticsService.getKpis();
    expect(kpis.fleetStatus).toEqual({ onTrip: 1, available: 1, inShop: 1, retired: 0 });
    expect(kpis.utilizationPct).toBe(Math.round((1 / 3) * 100));

    const truckOnly = await analyticsService.getKpis({ type: "TRUCK" });
    expect(truckOnly.fleetStatus).toEqual({ onTrip: 1, available: 1, inShop: 0, retired: 0 });
  });

  it("getFuelEfficiencyReport computes km/L from completed trips and their fuel logs", async () => {
    const vehicle = await makeVehicle({ odometerKm: 0 });
    const driver = await makeDriver();
    const trip = await tripService.createTrip({
      source: "A",
      destination: "B",
      vehicleId: vehicle.id,
      driverId: driver.id,
      cargoWeightKg: 500,
      plannedDistanceKm: 100,
      revenue: 5000,
    });
    await tripService.dispatchTrip(trip.id);
    await tripService.completeTrip(trip.id, { endOdometerKm: 100, fuelLiters: 10, fuelCost: 900 });

    const report = await analyticsService.getFuelEfficiencyReport();
    const entry = report.find((r) => r.vehicleId === vehicle.id);
    expect(entry).toBeDefined();
    expect(entry?.km).toBe(100);
    expect(entry?.liters).toBe(10);
    expect(entry?.kmPerLiter).toBe(10);
  });

  it("getVehicleCostReport sums fuel, maintenance, and other expenses per vehicle", async () => {
    const vehicle = await makeVehicle();
    await db.fuelLog.create({ data: { vehicleId: vehicle.id, liters: 5, cost: 500 } });
    await db.maintenanceLog.create({
      data: { vehicleId: vehicle.id, description: "Service", serviceType: "ROUTINE", cost: 1500 },
    });
    await db.expense.create({
      data: { vehicleId: vehicle.id, category: "TOLL", amount: 200, description: "Toll" },
    });

    const report = await analyticsService.getVehicleCostReport();
    const entry = report.find((r) => r.vehicleId === vehicle.id);
    expect(entry?.fuelCost).toBe(500);
    expect(entry?.maintenanceCost).toBe(1500);
    expect(entry?.otherExpenses).toBe(200);
    expect(entry?.totalCost).toBe(2200);
  });

  it("getRoiReport computes net and ROI% from revenue against fuel + maintenance", async () => {
    const vehicle = await makeVehicle({ acquisitionCost: 100_000, odometerKm: 0 });
    const driver = await makeDriver();
    const trip = await tripService.createTrip({
      source: "A",
      destination: "B",
      vehicleId: vehicle.id,
      driverId: driver.id,
      cargoWeightKg: 500,
      plannedDistanceKm: 100,
      revenue: 20_000,
    });
    await tripService.dispatchTrip(trip.id);
    await tripService.completeTrip(trip.id, { endOdometerKm: 100, fuelLiters: 10, fuelCost: 5000 });

    const report = await analyticsService.getRoiReport();
    const entry = report.find((r) => r.vehicleId === vehicle.id);
    expect(entry?.revenue).toBe(20_000);
    expect(entry?.fuelCost).toBe(5000);
    expect(entry?.net).toBe(15_000);
    expect(entry?.roiPct).toBe(15);
  });

  it("getFleetUtilization computes on-trip share per vehicle type, excluding retired vehicles", async () => {
    await makeVehicle({ type: "TRUCK", status: "ON_TRIP" });
    await makeVehicle({ type: "TRUCK", status: "AVAILABLE" });
    await makeVehicle({ type: "TRUCK", status: "RETIRED" });

    const report = await analyticsService.getFleetUtilization();
    const truck = report.find((r) => r.type === "TRUCK");
    expect(truck?.total).toBe(2);
    expect(truck?.onTrip).toBe(1);
    expect(truck?.pct).toBe(50);
  });
});
