import "server-only";
import { db } from "@/lib/db";

export type VehicleFilters = {
  type?: string;
  status?: string;
  region?: string;
};

function vehicleWhere(filters: VehicleFilters) {
  return {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.region ? { region: filters.region } : {}),
  };
}

/** Dashboard KPIs. Vehicle counts respect the type/status/region filters; trip and driver counts are fleet-wide. */
export async function getKpis(filters: VehicleFilters = {}) {
  const where = vehicleWhere(filters);
  const [byStatus, activeTrips, draftTrips, driversOnDuty] = await Promise.all([
    db.vehicle.groupBy({ by: ["status"], where, _count: { _all: true } }),
    db.trip.count({ where: { status: "DISPATCHED" } }),
    db.trip.count({ where: { status: "DRAFT" } }),
    db.driver.count({ where: { status: { in: ["AVAILABLE", "ON_TRIP"] } } }),
  ]);

  const count = (status: string) => byStatus.find((g) => g.status === status)?._count._all ?? 0;
  const onTrip = count("ON_TRIP");
  const available = count("AVAILABLE");
  const inShop = count("IN_SHOP");
  const retired = count("RETIRED");
  const active = onTrip + available + inShop;

  return {
    fleetStatus: { onTrip, available, inShop, retired },
    activeTrips,
    draftTrips,
    driversOnDuty,
    utilizationPct: active > 0 ? Math.round((onTrip / active) * 100) : 0,
  };
}

/** km/L per vehicle from completed trips (Σ end−start odometer) and their linked fuel logs. */
export async function getFuelEfficiencyReport() {
  const vehicles = await db.vehicle.findMany({
    include: {
      trips: { where: { status: "COMPLETED" }, include: { fuelLogs: true } },
    },
    orderBy: { regNumber: "asc" },
  });

  return vehicles
    .map((v) => {
      const km = v.trips.reduce(
        (s, t) => s + Math.max(0, (t.endOdometerKm ?? 0) - (t.startOdometerKm ?? 0)),
        0
      );
      const liters = v.trips.reduce((s, t) => s + t.fuelLogs.reduce((a, f) => a + f.liters, 0), 0);
      return {
        vehicleId: v.id,
        regNumber: v.regNumber,
        name: v.name,
        km,
        liters,
        kmPerLiter: liters > 0 ? Math.round((km / liters) * 10) / 10 : 0,
      };
    })
    .filter((r) => r.km > 0 && r.liters > 0);
}

/** Fuel vs maintenance vs other spend per vehicle (all logs, not just trip-linked). */
export async function getVehicleCostReport() {
  const vehicles = await db.vehicle.findMany({
    include: { fuelLogs: true, maintenanceLogs: true, expenses: true },
    orderBy: { regNumber: "asc" },
  });

  return vehicles
    .map((v) => {
      const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
      const maintenanceCost = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
      const otherExpenses = v.expenses.reduce((s, e) => s + e.amount, 0);
      return {
        vehicleId: v.id,
        regNumber: v.regNumber,
        name: v.name,
        fuelCost,
        maintenanceCost,
        otherExpenses,
        totalCost: fuelCost + maintenanceCost + otherExpenses,
      };
    })
    .filter((r) => r.totalCost > 0);
}

/** Share of the non-retired fleet currently on a trip, per vehicle type. */
export async function getFleetUtilization() {
  const vehicles = await db.vehicle.findMany({ where: { status: { not: "RETIRED" } } });
  const types = [...new Set(vehicles.map((v) => v.type))].sort();
  return types.map((type) => {
    const ofType = vehicles.filter((v) => v.type === type);
    const onTrip = ofType.filter((v) => v.status === "ON_TRIP").length;
    return {
      type,
      total: ofType.length,
      onTrip,
      pct: ofType.length > 0 ? Math.round((onTrip / ofType.length) * 100) : 0,
    };
  });
}

/** ROI per vehicle: (Σ trip revenue − (maintenance + fuel)) / acquisition cost. */
export async function getRoiReport() {
  const vehicles = await db.vehicle.findMany({
    include: {
      trips: { where: { status: "COMPLETED" } },
      fuelLogs: true,
      maintenanceLogs: true,
    },
    orderBy: { regNumber: "asc" },
  });

  return vehicles.map((v) => {
    const revenue = v.trips.reduce((s, t) => s + t.revenue, 0);
    const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const maintenanceCost = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
    const net = revenue - (fuelCost + maintenanceCost);
    return {
      vehicleId: v.id,
      regNumber: v.regNumber,
      name: v.name,
      status: v.status,
      revenue,
      fuelCost,
      maintenanceCost,
      net,
      acquisitionCost: v.acquisitionCost,
      roiPct: v.acquisitionCost > 0 ? Math.round((net / v.acquisitionCost) * 1000) / 10 : 0,
    };
  });
}
