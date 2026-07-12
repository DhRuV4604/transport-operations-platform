// One source of truth for how every operational status reads as color.
// Five tones map to the --status-* tokens in globals.css. Components never
// hand-roll status colors — they resolve a tone from here.

export type StatusTone = "available" | "active" | "shop" | "idle" | "blocked";

export const STATUS_TONE: Record<string, StatusTone> = {
  // Vehicles
  AVAILABLE: "available",
  ON_TRIP: "active",
  IN_SHOP: "shop",
  RETIRED: "idle",
  // Drivers
  OFF_DUTY: "idle",
  SUSPENDED: "blocked",
  // Trips
  DRAFT: "idle",
  DISPATCHED: "active",
  COMPLETED: "available",
  CANCELLED: "blocked",
  // Maintenance
  OPEN: "shop",
  CLOSED: "available",
};

export const TONE_VAR: Record<StatusTone, string> = {
  available: "var(--color-status-available)",
  active: "var(--color-status-active)",
  shop: "var(--color-status-shop)",
  idle: "var(--color-status-idle)",
  blocked: "var(--color-status-blocked)",
};

/** "Moving" states earn a live ping. */
export const TONE_IS_LIVE: Record<StatusTone, boolean> = {
  available: false,
  active: true,
  shop: false,
  idle: false,
  blocked: false,
};

export function toneFor(status: string): StatusTone {
  return STATUS_TONE[status] ?? "idle";
}
