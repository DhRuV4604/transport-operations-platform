"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { NAV_SECTIONS, NAV_ITEMS } from "@/components/nav-config";
import { openCommandMenu } from "@/components/command-menu";
import { cn } from "@/lib/utils";

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(href + "/");
}

export function AppSidebar() {
  const isActive = useActive();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar md:flex print:hidden">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>
      </div>

      {/* search affordance */}
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={openCommandMenu}
          className="flex h-8 w-full items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 text-sm text-muted-foreground transition-colors hover:border-input hover:text-foreground"
        >
          <Search className="size-4" />
          <span>Search…</span>
          <kbd className="kbd ml-auto">⌘K</kbd>
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-2 pb-1 text-[0.6875rem] font-medium tracking-wide text-muted-foreground/60 uppercase">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, jump }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      {active && (
                        <span className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                      )}
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="flex-1">{label}</span>
                      <kbd className="kbd opacity-0 transition-opacity group-hover:opacity-100">
                        g {jump}
                      </kbd>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t px-4 py-2.5 text-[0.6875rem] text-muted-foreground/70">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("shortcuts:open"))}
          className="transition-colors hover:text-foreground"
        >
          Press <kbd className="kbd">?</kbd> for shortcuts
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const isActive = useActive();
  return (
    <nav className="flex overflow-x-auto border-t bg-background md:hidden print:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex min-w-16 flex-1 flex-col items-center gap-1 py-2 text-[10px] transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            {active && (
              <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
            )}
            <Icon className="size-4" />
            {label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
