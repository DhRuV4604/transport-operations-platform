import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export type SearchItem = {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  status?: string;
};

export type SearchGroup = { group: string; items: SearchItem[] };

const PER_GROUP = 5;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return Response.json({ groups: [] satisfies SearchGroup[] });

  const like = { contains: q };

  const [vehicles, drivers, trips, maintenance] = await Promise.all([
    db.vehicle.findMany({
      where: { OR: [{ regNumber: like }, { name: like }, { region: like }] },
      take: PER_GROUP,
      orderBy: { regNumber: "asc" },
    }),
    db.driver.findMany({
      where: { OR: [{ name: like }, { licenseNumber: like }, { phone: like }] },
      take: PER_GROUP,
      orderBy: { name: "asc" },
    }),
    db.trip.findMany({
      where: { OR: [{ source: like }, { destination: like }] },
      take: PER_GROUP,
      orderBy: { createdAt: "desc" },
      include: { vehicle: true, driver: true },
    }),
    db.maintenanceLog.findMany({
      where: { description: like },
      take: PER_GROUP,
      orderBy: { openedAt: "desc" },
      include: { vehicle: true },
    }),
  ]);

  const groups: SearchGroup[] = [];

  if (vehicles.length)
    groups.push({
      group: "Vehicles",
      items: vehicles.map((v) => ({
        id: v.id,
        label: v.regNumber,
        sublabel: `${v.name} · ${v.type}`,
        href: `/vehicles/${v.id}`,
        status: v.status,
      })),
    });

  if (drivers.length)
    groups.push({
      group: "Drivers",
      items: drivers.map((d) => ({
        id: d.id,
        label: d.name,
        sublabel: `${d.licenseNumber} · ${d.licenseCategory}`,
        href: `/drivers/${d.id}`,
        status: d.status,
      })),
    });

  if (trips.length)
    groups.push({
      group: "Trips",
      items: trips.map((t) => ({
        id: t.id,
        label: `${t.source} → ${t.destination}`,
        sublabel: `${t.vehicle.regNumber} · ${t.driver.name}`,
        href: `/trips/${t.id}`,
        status: t.status,
      })),
    });

  if (maintenance.length)
    groups.push({
      group: "Maintenance",
      items: maintenance.map((m) => ({
        id: m.id,
        label: m.description,
        sublabel: `${m.vehicle.regNumber} · ${m.serviceType}`,
        href: "/maintenance",
        status: m.status,
      })),
    });

  return Response.json({ groups });
}
