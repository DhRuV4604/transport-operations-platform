"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Map,
  Wrench,
  Fuel,
  BarChart3,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicles", icon: Truck },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/trips", label: "Trips", icon: Route },
  { href: "/live-map", label: "Live Map", icon: Map },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/expenses", label: "Fuel & Expenses", icon: Fuel },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/audit", label: "Audit Log", icon: History },
];

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-sidebar print:hidden">
      <div className="flex h-14 items-center gap-2 border-b px-4 font-bold">
        <Truck className="h-5 w-5" />
        TransitOps
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden flex overflow-x-auto border-t bg-background print:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-1 min-w-16 flex-col items-center gap-1 py-2 text-[10px]",
            pathname.startsWith(href) ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label.split(" ")[0]}
        </Link>
      ))}
    </nav>
  );
}
