import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { resolveCoords, project } from "@/lib/geo";
import { LiveMap, type LiveTrip } from "./live-map";

export default async function LiveMapPage() {
  await requireSession();

  const trips = await db.trip.findMany({
    where: { status: "DISPATCHED" },
    include: { vehicle: true, driver: true },
    orderBy: { dispatchedAt: "desc" },
  });

  const liveTrips: LiveTrip[] = trips.map((t) => {
    const from = project(resolveCoords(t.source, t.vehicle.region));
    const to = project(resolveCoords(t.destination, t.vehicle.region));
    return {
      id: t.id,
      source: t.source,
      destination: t.destination,
      vehicleReg: t.vehicle.regNumber,
      vehicleName: t.vehicle.name,
      vehicleType: t.vehicle.type,
      driverName: t.driver.name,
      cargoWeightKg: t.cargoWeightKg,
      plannedDistanceKm: t.plannedDistanceKm,
      revenue: t.revenue,
      dispatchedAt: t.dispatchedAt ? t.dispatchedAt.toISOString() : null,
      from,
      to,
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Live Map</h1>
        <p className="text-sm text-muted-foreground">
          Real-time view of vehicles currently on the road
        </p>
      </div>
      <LiveMap trips={liveTrips} />
    </div>
  );
}
