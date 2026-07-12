export const ROLES = [
  "FLEET_MANAGER",
  "DISPATCHER",
  "SAFETY_OFFICER",
  "FINANCIAL_ANALYST",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

export const VEHICLE_STATUS = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUS)[number];

export const VEHICLE_TYPES = ["TRUCK", "VAN", "BIKE"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const REGIONS = ["NORTH", "SOUTH", "WEST", "EAST"] as const;

export const DRIVER_STATUS = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"] as const;
export type DriverStatus = (typeof DRIVER_STATUS)[number];

export const LICENSE_CATEGORIES = ["LMV", "HMV", "MCWG"] as const;

export const TRIP_STATUS = ["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"] as const;
export type TripStatus = (typeof TRIP_STATUS)[number];

export const MAINTENANCE_STATUS = ["OPEN", "CLOSED"] as const;
export const SERVICE_TYPES = ["ROUTINE", "REPAIR", "INSPECTION"] as const;

export const EXPENSE_CATEGORIES = ["TOLL", "PARKING", "FINE", "OTHER"] as const;

export const DOCUMENT_KINDS = ["RC", "INSURANCE", "PERMIT", "PUC", "OTHER"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
  RETIRED: "Retired",
  OFF_DUTY: "Off Duty",
  SUSPENDED: "Suspended",
  DRAFT: "Draft",
  DISPATCHED: "Dispatched",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  OPEN: "Open",
  CLOSED: "Closed",
};

// Server-side write permissions per module. Everyone can view everything.
export const PERMISSIONS = {
  "vehicles.write": ["FLEET_MANAGER"],
  "drivers.write": ["SAFETY_OFFICER"],
  "trips.write": ["DISPATCHER"],
  "maintenance.write": ["FLEET_MANAGER"],
  "expenses.write": ["FINANCIAL_ANALYST", "FLEET_MANAGER", "DISPATCHER"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: string, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}
