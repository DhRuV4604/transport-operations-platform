#!/usr/bin/env node
/**
 * Standalone MCP (Model Context Protocol) server for the transport-operations-platform fleet.
 *
 * It talks to the SAME SQLite database as the Next.js app (via DATABASE_URL) but runs as its
 * own process over stdio, so any MCP client (Claude Desktop, Claude Code, Cursor, etc.) can
 * connect and run quick, read-only "daily checkup" queries without opening the web app.
 *
 * Run directly:   npm run mcp
 * Or point any MCP client at:  npx tsx mcp/server.ts   (from anywhere — it locates its own .env)
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { differenceInCalendarDays, format } from "date-fns";

// GUI MCP clients (Claude Desktop, etc.) spawn this process without your shell's
// environment, so DATABASE_URL wouldn't otherwise be set. Load the repo's .env
// ourselves, resolved relative to this file (not the caller's cwd). Values the
// launcher already set (e.g. in tests) take priority — loadEnvFile never overwrites
// an existing process.env entry.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(repoRoot, ".env");
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);

const db = new PrismaClient();

const fmtDate = (d: Date | null | undefined) => (d ? format(d, "yyyy-MM-dd") : "—");
const daysUntil = (d: Date) => differenceInCalendarDays(d, new Date());
const cutoff = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

function text(value: string) {
  return { content: [{ type: "text" as const, text: value }] };
}

const server = new McpServer({
  name: "transport-ops",
  version: "1.0.0",
  title: "Transport Operations Fleet Checkup",
});

const readOnly = { readOnlyHint: true, openWorldHint: false };

// ---------------------------------------------------------------------------
// 1. Daily digest — the "run this every morning" tool.
// ---------------------------------------------------------------------------
server.registerTool(
  "fleet_daily_digest",
  {
    title: "Fleet daily digest",
    description:
      "One-shot snapshot of fleet health: vehicle status breakdown, trip activity, drivers on duty, " +
      "licenses/documents expiring within 30 days, and open maintenance jobs. Start every daily checkup here.",
    inputSchema: {},
    annotations: readOnly,
  },
  async () => {
    const soon = cutoff(30);
    const [byStatus, activeTrips, draftTrips, driversOnDuty, expiringLicenses, expiringDocuments, openMaintenance] =
      await Promise.all([
        db.vehicle.groupBy({ by: ["status"], _count: { _all: true } }),
        db.trip.count({ where: { status: "DISPATCHED" } }),
        db.trip.count({ where: { status: "DRAFT" } }),
        db.driver.count({ where: { status: { in: ["AVAILABLE", "ON_TRIP"] } } }),
        db.driver.count({ where: { licenseExpiry: { lte: soon } } }),
        db.vehicleDocument.count({ where: { expiryDate: { not: null, lte: soon } } }),
        db.maintenanceLog.count({ where: { status: "OPEN" } }),
      ]);

    const count = (status: string) => byStatus.find((g) => g.status === status)?._count._all ?? 0;
    const onTrip = count("ON_TRIP");
    const available = count("AVAILABLE");
    const inShop = count("IN_SHOP");
    const retired = count("RETIRED");
    const active = onTrip + available + inShop;
    const utilizationPct = active > 0 ? Math.round((onTrip / active) * 100) : 0;

    const flags: string[] = [];
    if (expiringLicenses > 0) flags.push(`${expiringLicenses} driver license(s) expiring/expired within 30 days`);
    if (expiringDocuments > 0) flags.push(`${expiringDocuments} vehicle document(s) expiring/expired within 30 days`);
    if (openMaintenance > 0) flags.push(`${openMaintenance} maintenance job(s) still open`);

    const lines = [
      `Fleet — ${onTrip} on trip, ${available} available, ${inShop} in shop, ${retired} retired (utilization ${utilizationPct}%)`,
      `Trips — ${activeTrips} dispatched, ${draftTrips} draft`,
      `Drivers on duty — ${driversOnDuty}`,
      flags.length ? `Needs attention — ${flags.join("; ")}` : "Needs attention — nothing, all clear.",
    ];
    return text(lines.join("\n"));
  }
);

// ---------------------------------------------------------------------------
// 2. Expiring driver licenses
// ---------------------------------------------------------------------------
server.registerTool(
  "list_expiring_licenses",
  {
    title: "List expiring driver licenses",
    description: "Driver licenses that have already expired or expire within the given number of days (default 30).",
    inputSchema: {
      days: z.number().int().positive().max(365).default(30).describe("Look-ahead window in days"),
    },
    annotations: readOnly,
  },
  async ({ days }) => {
    const drivers = await db.driver.findMany({
      where: { licenseExpiry: { lte: cutoff(days) } },
      orderBy: { licenseExpiry: "asc" },
    });
    if (drivers.length === 0) return text(`No driver licenses expiring within ${days} days.`);
    const lines = drivers.map((d) => {
      const left = daysUntil(d.licenseExpiry);
      const flag = left < 0 ? `EXPIRED ${Math.abs(left)}d ago` : `expires in ${left}d`;
      return `- ${d.name} (${d.licenseNumber}, ${d.licenseCategory}) — ${fmtDate(d.licenseExpiry)} — ${flag} — status ${d.status}`;
    });
    return text(`${drivers.length} driver license(s) expiring within ${days} days:\n` + lines.join("\n"));
  }
);

// ---------------------------------------------------------------------------
// 3. Expiring vehicle documents
// ---------------------------------------------------------------------------
server.registerTool(
  "list_expiring_documents",
  {
    title: "List expiring vehicle documents",
    description:
      "Vehicle documents (RC, insurance, permit, PUC, etc.) that have expired or expire within the given number of days (default 30).",
    inputSchema: {
      days: z.number().int().positive().max(365).default(30).describe("Look-ahead window in days"),
    },
    annotations: readOnly,
  },
  async ({ days }) => {
    const docs = await db.vehicleDocument.findMany({
      where: { expiryDate: { not: null, lte: cutoff(days) } },
      orderBy: { expiryDate: "asc" },
      include: { vehicle: true },
    });
    if (docs.length === 0) return text(`No vehicle documents expiring within ${days} days.`);
    const lines = docs.map((doc) => {
      const left = daysUntil(doc.expiryDate as Date);
      const flag = left < 0 ? `EXPIRED ${Math.abs(left)}d ago` : `expires in ${left}d`;
      return `- ${doc.vehicle.regNumber} (${doc.vehicle.name}) — ${doc.kind} "${doc.title}" — ${fmtDate(doc.expiryDate)} — ${flag}`;
    });
    return text(`${docs.length} vehicle document(s) expiring within ${days} days:\n` + lines.join("\n"));
  }
);

// ---------------------------------------------------------------------------
// 4. Open maintenance jobs
// ---------------------------------------------------------------------------
server.registerTool(
  "list_open_maintenance",
  {
    title: "List open maintenance jobs",
    description: "Maintenance logs still OPEN, optionally filtered to a vehicle by registration number.",
    inputSchema: {
      vehicleRegNumber: z.string().optional().describe("Filter to a single vehicle's registration number (partial match)"),
    },
    annotations: readOnly,
  },
  async ({ vehicleRegNumber }) => {
    const jobs = await db.maintenanceLog.findMany({
      where: {
        status: "OPEN",
        ...(vehicleRegNumber ? { vehicle: { regNumber: { contains: vehicleRegNumber } } } : {}),
      },
      orderBy: { openedAt: "asc" },
      include: { vehicle: true },
    });
    if (jobs.length === 0) return text("No open maintenance jobs.");
    const lines = jobs.map((j) => {
      const openDays = daysUntil(j.openedAt) * -1;
      return `- ${j.vehicle.regNumber} — ${j.serviceType}: ${j.description} — open ${openDays}d (since ${fmtDate(j.openedAt)}) — cost so far ₹${j.cost}`;
    });
    return text(`${jobs.length} open maintenance job(s):\n` + lines.join("\n"));
  }
);

// ---------------------------------------------------------------------------
// 5. Active trips
// ---------------------------------------------------------------------------
server.registerTool(
  "list_active_trips",
  {
    title: "List active (dispatched) trips",
    description: "Trips currently DISPATCHED, with vehicle, driver, and cargo details.",
    inputSchema: {},
    annotations: readOnly,
  },
  async () => {
    const trips = await db.trip.findMany({
      where: { status: "DISPATCHED" },
      orderBy: { dispatchedAt: "asc" },
      include: { vehicle: true, driver: true },
    });
    if (trips.length === 0) return text("No trips currently dispatched.");
    const lines = trips.map(
      (t) =>
        `- ${t.source} → ${t.destination} — ${t.vehicle.regNumber} / ${t.driver.name} — ${t.cargoWeightKg}kg — dispatched ${fmtDate(t.dispatchedAt)}`
    );
    return text(`${trips.length} active trip(s):\n` + lines.join("\n"));
  }
);

// ---------------------------------------------------------------------------
// 6. Vehicle lookup
// ---------------------------------------------------------------------------
server.registerTool(
  "get_vehicle_status",
  {
    title: "Get vehicle status",
    description: "Full status for one vehicle by registration number (partial match): state, odometer, open maintenance, upcoming document expiries, and its most recent trip.",
    inputSchema: {
      regNumber: z.string().describe("Vehicle registration number, or part of it"),
    },
    annotations: readOnly,
  },
  async ({ regNumber }) => {
    const vehicle = await db.vehicle.findFirst({
      where: { regNumber: { contains: regNumber } },
      include: {
        maintenanceLogs: { where: { status: "OPEN" } },
        documents: { orderBy: { expiryDate: "asc" } },
        trips: { orderBy: { createdAt: "desc" }, take: 1, include: { driver: true } },
      },
    });
    if (!vehicle) return text(`No vehicle found matching "${regNumber}".`);

    const lines = [
      `${vehicle.regNumber} — ${vehicle.name} (${vehicle.type}) — status ${vehicle.status} — region ${vehicle.region}`,
      `Odometer: ${vehicle.odometerKm}km`,
      vehicle.maintenanceLogs.length
        ? `Open maintenance: ${vehicle.maintenanceLogs.map((m) => `${m.serviceType} (${m.description})`).join(", ")}`
        : "Open maintenance: none",
      vehicle.documents.length
        ? "Documents:\n" +
          vehicle.documents
            .map((d) => `  - ${d.kind} "${d.title}" — expires ${fmtDate(d.expiryDate)}`)
            .join("\n")
        : "Documents: none on file",
      vehicle.trips[0]
        ? `Most recent trip: ${vehicle.trips[0].source} → ${vehicle.trips[0].destination} (${vehicle.trips[0].status}) with ${vehicle.trips[0].driver.name}`
        : "Most recent trip: none",
    ];
    return text(lines.join("\n"));
  }
);

// ---------------------------------------------------------------------------
// 7. Driver lookup
// ---------------------------------------------------------------------------
server.registerTool(
  "get_driver_status",
  {
    title: "Get driver status",
    description: "Full status for one driver by name or license number (partial match): duty status, license expiry, safety score, and most recent trip.",
    inputSchema: {
      query: z.string().describe("Driver name or license number, or part of it"),
    },
    annotations: readOnly,
  },
  async ({ query }) => {
    const driver = await db.driver.findFirst({
      where: { OR: [{ name: { contains: query } }, { licenseNumber: { contains: query } }] },
      include: { trips: { orderBy: { createdAt: "desc" }, take: 1, include: { vehicle: true } } },
    });
    if (!driver) return text(`No driver found matching "${query}".`);

    const left = daysUntil(driver.licenseExpiry);
    const licenseFlag = left < 0 ? `EXPIRED ${Math.abs(left)}d ago` : `expires in ${left}d`;
    const lines = [
      `${driver.name} — status ${driver.status} — safety score ${driver.safetyScore}`,
      `License: ${driver.licenseNumber} (${driver.licenseCategory}) — ${fmtDate(driver.licenseExpiry)} — ${licenseFlag}`,
      `Phone: ${driver.phone}`,
      driver.trips[0]
        ? `Most recent trip: ${driver.trips[0].source} → ${driver.trips[0].destination} (${driver.trips[0].status}) in ${driver.trips[0].vehicle.regNumber}`
        : "Most recent trip: none",
    ];
    return text(lines.join("\n"));
  }
);

// ---------------------------------------------------------------------------
// 8. Free-text search
// ---------------------------------------------------------------------------
server.registerTool(
  "search_fleet",
  {
    title: "Search fleet",
    description: "Free-text search across vehicles, drivers, and trips (registration numbers, names, license numbers, routes). Good for quickly finding a record before drilling in.",
    inputSchema: {
      query: z.string().min(1).describe("Search text"),
    },
    annotations: readOnly,
  },
  async ({ query }) => {
    const like = { contains: query };
    const [vehicles, drivers, trips] = await Promise.all([
      db.vehicle.findMany({ where: { OR: [{ regNumber: like }, { name: like }, { region: like }] }, take: 5 }),
      db.driver.findMany({ where: { OR: [{ name: like }, { licenseNumber: like }, { phone: like }] }, take: 5 }),
      db.trip.findMany({
        where: { OR: [{ source: like }, { destination: like }] },
        take: 5,
        include: { vehicle: true, driver: true },
      }),
    ]);

    if (!vehicles.length && !drivers.length && !trips.length) return text(`No matches for "${query}".`);

    const sections: string[] = [];
    if (vehicles.length)
      sections.push("Vehicles:\n" + vehicles.map((v) => `  - ${v.regNumber} — ${v.name} (${v.status})`).join("\n"));
    if (drivers.length)
      sections.push("Drivers:\n" + drivers.map((d) => `  - ${d.name} — ${d.licenseNumber} (${d.status})`).join("\n"));
    if (trips.length)
      sections.push(
        "Trips:\n" +
          trips.map((t) => `  - ${t.source} → ${t.destination} — ${t.vehicle.regNumber}/${t.driver.name} (${t.status})`).join("\n")
      );
    return text(sections.join("\n\n"));
  }
);

// ---------------------------------------------------------------------------
// 9. Recent audit log
// ---------------------------------------------------------------------------
server.registerTool(
  "list_recent_audit_events",
  {
    title: "List recent audit events",
    description: "Most recent audit log entries (who did what, to which entity), newest first.",
    inputSchema: {
      limit: z.number().int().positive().max(50).default(10).describe("Number of events to return"),
    },
    annotations: readOnly,
  },
  async ({ limit }) => {
    const events = await db.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: limit });
    if (events.length === 0) return text("No audit events recorded yet.");
    const lines = events.map(
      (e) =>
        `- [${format(e.createdAt, "yyyy-MM-dd HH:mm")}] ${e.actorName} (${e.actorRole}) — ${e.action} — ${e.entityType} "${e.entityLabel}"${e.detail ? ` — ${e.detail}` : ""}`
    );
    return text(lines.join("\n"));
  }
);

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await db.$disconnect();
  process.exit(0);
}

async function main() {
  const transport = new StdioServerTransport();
  // The MCP client (or the parent process piping our stdin) closing the connection
  // is the normal way this server is stopped — release the Prisma/SQLite handle then,
  // not just on SIGINT, so the process doesn't linger holding a lock on the db file.
  server.server.onclose = () => void shutdown();
  await server.connect(transport);
  console.error("transport-ops MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error running transport-ops MCP server:", err);
  process.exit(1);
});

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
