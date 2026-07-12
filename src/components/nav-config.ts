import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  History,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Second key in the `g`-then-key jump (e.g. "d" → g d → Dashboard). */
  jump: string;
  keywords?: string;
};

export type NavSection = { title: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, jump: "d", keywords: "home kpi overview" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/vehicles", label: "Vehicles", icon: Truck, jump: "v", keywords: "fleet trucks vans registry" },
      { href: "/drivers", label: "Drivers", icon: Users, jump: "u", keywords: "people licenses safety" },
      { href: "/trips", label: "Trips", icon: Route, jump: "t", keywords: "dispatch routes journeys" },
    ],
  },
  {
    title: "Upkeep & spend",
    items: [
      { href: "/maintenance", label: "Maintenance", icon: Wrench, jump: "m", keywords: "service repair inspection shop" },
      { href: "/expenses", label: "Fuel & Expenses", icon: Fuel, jump: "e", keywords: "cost toll parking fine diesel" },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3, jump: "r", keywords: "analytics roi export charts" },
      { href: "/audit", label: "Audit Log", icon: History, jump: "a", keywords: "history activity events trail" },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
