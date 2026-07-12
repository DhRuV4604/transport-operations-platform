import { beforeEach, describe, expect, it } from "vitest";
import * as auditService from "@/server/services/auditService";
import { resetDb } from "./helpers";

const actor = { userId: "user-1", role: "FLEET_MANAGER" as const, name: "Fiona Fleet", email: "fiona@example.com" };

describe("auditService", () => {
  beforeEach(resetDb);

  it("records who did what to which entity, and lists newest first", async () => {
    await auditService.logAuditEvent(actor, {
      action: "VEHICLE_RETIRED",
      entityType: "VEHICLE",
      entityId: "v1",
      entityLabel: "MH-01-AB-1234",
    });
    await auditService.logAuditEvent(actor, {
      action: "DRIVER_SUSPENDED",
      entityType: "DRIVER",
      entityId: "d1",
      entityLabel: "Test Driver",
    });

    const events = await auditService.listAuditEvents();
    expect(events).toHaveLength(2);
    expect(events[0].action).toBe("DRIVER_SUSPENDED");
    expect(events[0].actorName).toBe("Fiona Fleet");
    expect(events[1].action).toBe("VEHICLE_RETIRED");
  });
});
