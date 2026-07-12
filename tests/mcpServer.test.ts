import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { makeDriver, makeVehicle, resetDb } from "./helpers";
import { TEST_DATABASE_URL } from "./db-path";

const repoRoot = path.resolve(__dirname, "..");

function textOf(result: CallToolResult) {
  const first = result.content[0];
  return first?.type === "text" ? first.text : "";
}

describe("transport-ops MCP server", () => {
  let client: Client;

  beforeAll(async () => {
    const transport = new StdioClientTransport({
      command: "npx",
      args: ["tsx", path.join(repoRoot, "mcp/server.ts")],
      cwd: repoRoot,
      env: { DATABASE_URL: TEST_DATABASE_URL },
      stderr: "ignore",
    });
    client = new Client({ name: "mcp-test-client", version: "1.0.0" });
    await client.connect(transport);
  }, 30_000);

  afterAll(async () => {
    await client?.close();
  });

  beforeEach(resetDb);

  it("advertises all nine read-only checkup tools", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      [
        "fleet_daily_digest",
        "get_driver_status",
        "get_vehicle_status",
        "list_active_trips",
        "list_expiring_documents",
        "list_expiring_licenses",
        "list_open_maintenance",
        "list_recent_audit_events",
        "search_fleet",
      ].sort()
    );
    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint).toBe(true);
    }
  });

  it("fleet_daily_digest reflects live vehicle status counts", async () => {
    await makeVehicle({ status: "AVAILABLE" });
    await makeVehicle({ status: "ON_TRIP" });
    await makeVehicle({ status: "IN_SHOP" });

    const res = await client.callTool({ name: "fleet_daily_digest", arguments: {} });
    const text = textOf(res as CallToolResult);
    expect(text).toMatch(/1 on trip/);
    expect(text).toMatch(/1 available/);
    expect(text).toMatch(/1 in shop/);
  });

  it("list_expiring_licenses returns only licenses inside the window", async () => {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    await makeDriver({ name: "Expired Driver", licenseExpiry: new Date(now - 5 * DAY) });
    await makeDriver({ name: "Safe Driver", licenseExpiry: new Date(now + 200 * DAY) });

    const res = await client.callTool({ name: "list_expiring_licenses", arguments: { days: 30 } });
    const text = textOf(res as CallToolResult);
    expect(text).toContain("Expired Driver");
    expect(text).toContain("EXPIRED");
    expect(text).not.toContain("Safe Driver");
  });

  it("get_vehicle_status reports a clear miss for an unknown registration", async () => {
    const res = await client.callTool({ name: "get_vehicle_status", arguments: { regNumber: "NOPE-999" } });
    expect(textOf(res as CallToolResult)).toMatch(/no vehicle found/i);
  });

  it("get_vehicle_status finds a vehicle by partial registration match", async () => {
    await makeVehicle({ regNumber: "GJ01-TRK-777", name: "Search Target" });
    const res = await client.callTool({ name: "get_vehicle_status", arguments: { regNumber: "TRK-777" } });
    expect(textOf(res as CallToolResult)).toContain("Search Target");
  });

  it("search_fleet matches vehicles by partial registration number", async () => {
    await makeVehicle({ regNumber: "KA05-BUS-321", name: "Findable Bus" });
    const res = await client.callTool({ name: "search_fleet", arguments: { query: "BUS-321" } });
    expect(textOf(res as CallToolResult)).toContain("Findable Bus");
  });

  it("reports an error result for an unknown tool", async () => {
    const res = (await client.callTool({ name: "not_a_real_tool", arguments: {} })) as CallToolResult;
    expect(res.isError).toBe(true);
  });
});
