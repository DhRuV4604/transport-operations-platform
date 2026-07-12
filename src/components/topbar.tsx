"use client";

import Link from "next/link";
import { Search, Bell, LogOut, Keyboard, ChevronDown, CheckCircle2 } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { openCommandMenu, openShortcuts } from "@/components/command-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar({
  name,
  role,
  expiringLicenses,
  expiringDocuments,
  logout,
}: {
  name: string;
  role: Role;
  expiringLicenses: number;
  expiringDocuments: number;
  logout: () => void;
}) {
  const attention = expiringLicenses + expiringDocuments;

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur print:hidden">
      <Link href="/dashboard" className="md:hidden" aria-label="TransitOps">
        <LogoMark className="size-6" />
      </Link>

      <button
        type="button"
        onClick={openCommandMenu}
        className="flex h-9 max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-input hover:text-foreground"
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden truncate sm:inline">
          Search vehicles, drivers, trips…
        </span>
        <span className="truncate sm:hidden">Search</span>
        <kbd className="kbd ml-auto hidden sm:inline-flex">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        {/* attention */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label={`Attention: ${attention} items`}
          >
            <Bell className="size-5" />
            {attention > 0 && (
              <span className="absolute top-1.5 right-1.5 flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-70 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-warning ring-2 ring-background" />
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Needs attention</DropdownMenuLabel>
            {attention === 0 ? (
              <div className="flex items-center gap-2 px-1.5 py-3 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-success" />
                All clear — nothing expiring.
              </div>
            ) : (
              <>
                <DropdownMenuItem
                  render={<Link href="/drivers" />}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-warning" />
                    Licenses expiring
                  </span>
                  <span className="font-medium tabular-nums">{expiringLicenses}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/vehicles" />}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-warning" />
                    Documents expiring
                  </span>
                  <span className="font-medium tabular-nums">{expiringDocuments}</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        {/* user */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                "bg-primary/12 text-primary"
              )}
            >
              {initials(name)}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-32 truncate font-medium">{name}</span>
              <span className="block text-xs text-muted-foreground">
                {ROLE_LABELS[role]}
              </span>
            </span>
            <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5 py-1.5">
              <span className="text-sm font-medium text-foreground">{name}</span>
              <span className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={openShortcuts}>
              <Keyboard className="size-4" />
              Keyboard shortcuts
              <kbd className="kbd ml-auto">?</kbd>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logout}>
              <DropdownMenuItem
                variant="destructive"
                render={<button type="submit" className="w-full" />}
              >
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
