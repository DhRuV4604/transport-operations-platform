import { format } from "date-fns";
import { getSession } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { getRoiReport } from "@/server/services/analyticsService";

const fmtDate = (d: Date) => format(d, "yyyy-MM-dd");

async function buildCsv(report: string): Promise<string | null> {
  switch (report) {
    case "vehicles": {
      const rows = await db.vehicle.findMany({ orderBy: { regNumber: "asc" } });
      return toCsv(rows, [
        { header: "Registration", value: (v) => v.regNumber },
        { header: "Name", value: (v) => v.name },
        { header: "Type", value: (v) => v.type },
        { header: "Max Load (kg)", value: (v) => v.maxLoadKg },
        { header: "Odometer (km)", value: (v) => v.odometerKm },
        { header: "Acquisition Cost", value: (v) => v.acquisitionCost },
        { header: "Region", value: (v) => v.region },
        { header: "Status", value: (v) => v.status },
      ]);
    }
    case "drivers": {
      const rows = await db.driver.findMany({ orderBy: { name: "asc" } });
      return toCsv(rows, [
        { header: "Name", value: (d) => d.name },
        { header: "License Number", value: (d) => d.licenseNumber },
        { header: "License Category", value: (d) => d.licenseCategory },
        { header: "License Expiry", value: (d) => fmtDate(d.licenseExpiry) },
        { header: "Phone", value: (d) => d.phone },
        { header: "Safety Score", value: (d) => d.safetyScore },
        { header: "Status", value: (d) => d.status },
      ]);
    }
    case "trips": {
      const rows = await db.trip.findMany({
        include: { vehicle: true, driver: true },
        orderBy: { createdAt: "desc" },
      });
      return toCsv(rows, [
        { header: "Source", value: (t) => t.source },
        { header: "Destination", value: (t) => t.destination },
        { header: "Vehicle", value: (t) => t.vehicle.regNumber },
        { header: "Driver", value: (t) => t.driver.name },
        { header: "Cargo (kg)", value: (t) => t.cargoWeightKg },
        { header: "Planned Distance (km)", value: (t) => t.plannedDistanceKm },
        { header: "Revenue", value: (t) => t.revenue },
        { header: "Status", value: (t) => t.status },
        { header: "Start Odometer (km)", value: (t) => t.startOdometerKm },
        { header: "End Odometer (km)", value: (t) => t.endOdometerKm },
        { header: "Created", value: (t) => fmtDate(t.createdAt) },
      ]);
    }
    case "fuel": {
      const rows = await db.fuelLog.findMany({
        include: { vehicle: true, trip: true },
        orderBy: { date: "desc" },
      });
      return toCsv(rows, [
        { header: "Vehicle", value: (f) => f.vehicle.regNumber },
        { header: "Liters", value: (f) => f.liters },
        { header: "Cost", value: (f) => f.cost },
        { header: "Trip", value: (f) => (f.trip ? `${f.trip.source} - ${f.trip.destination}` : "") },
        { header: "Date", value: (f) => fmtDate(f.date) },
      ]);
    }
    case "expenses": {
      const rows = await db.expense.findMany({
        include: { vehicle: true },
        orderBy: { date: "desc" },
      });
      return toCsv(rows, [
        { header: "Category", value: (e) => e.category },
        { header: "Description", value: (e) => e.description },
        { header: "Vehicle", value: (e) => e.vehicle?.regNumber ?? "" },
        { header: "Amount", value: (e) => e.amount },
        { header: "Date", value: (e) => fmtDate(e.date) },
      ]);
    }
    case "roi": {
      const rows = await getRoiReport();
      return toCsv(rows, [
        { header: "Vehicle", value: (r) => r.regNumber },
        { header: "Name", value: (r) => r.name },
        { header: "Status", value: (r) => r.status },
        { header: "Revenue", value: (r) => r.revenue },
        { header: "Fuel Cost", value: (r) => r.fuelCost },
        { header: "Maintenance Cost", value: (r) => r.maintenanceCost },
        { header: "Net", value: (r) => r.net },
        { header: "Acquisition Cost", value: (r) => r.acquisitionCost },
        { header: "ROI %", value: (r) => r.roiPct },
      ]);
    }
    default:
      return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ report: string }> }
) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { report } = await params;
  const csv = await buildCsv(report);
  if (csv == null) return new Response("Unknown report", { status: 404 });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${report}-${format(new Date(), "yyyyMMdd")}.csv"`,
    },
  });
}
