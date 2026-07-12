import "server-only";
import { db } from "@/lib/db";
import type { Session } from "@/lib/auth";

export type AuditAction =
  | "VEHICLE_RETIRED"
  | "DRIVER_SUSPENDED"
  | "DRIVER_REINSTATED"
  | "TRIP_DISPATCHED"
  | "TRIP_COMPLETED"
  | "TRIP_CANCELLED"
  | "MAINTENANCE_OPENED"
  | "MAINTENANCE_CLOSED";

export function logAuditEvent(
  actor: Session,
  event: {
    action: AuditAction;
    entityType: "VEHICLE" | "DRIVER" | "TRIP" | "MAINTENANCE";
    entityId: string;
    entityLabel: string;
    detail?: string;
  }
) {
  return db.auditEvent.create({
    data: {
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      ...event,
    },
  });
}

export function listAuditEvents(limit = 200) {
  return db.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}
