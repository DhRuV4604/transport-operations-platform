"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  Search,
  CornerDownLeft,
  Plus,
  Sun,
  Moon,
  Monitor,
  Keyboard,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { NAV_ITEMS } from "@/components/nav-config";
import { StatusDot } from "@/components/status-dot";
import type { SearchGroup } from "@/app/api/search/route";
import { cn } from "@/lib/utils";

/** Fire this to open the palette from anywhere (topbar button, etc.). */
export const OPEN_EVENT = "command-menu:open";
export function openCommandMenu() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}
export function openShortcuts() {
  window.dispatchEvent(new Event("shortcuts:open"));
}

type Item = {
  id: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  status?: string;
  hint?: string;
  keywords?: string;
  perform: () => void;
};
type Section = { group: string; items: Item[] };

export function CommandMenu() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [groups, setGroups] = React.useState<SearchGroup[]>([]);
  const [loading, setLoading] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Global open triggers: ⌘K / Ctrl+K, and the custom event.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  // Reset transient state each time it opens.
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setGroups([]);
      setActive(0);
    }
  }, [open]);

  const run = React.useCallback((fn: () => void) => {
    setOpen(false);
    // let the dialog close before navigating
    setTimeout(fn, 0);
  }, []);

  // Debounced live search.
  React.useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 1) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { groups: SearchGroup[] };
        setGroups(data.groups ?? []);
      } catch {
        /* aborted or failed — keep last results */
      } finally {
        setLoading(false);
      }
    }, 160);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, open]);

  const q = query.trim().toLowerCase();

  const sections = React.useMemo<Section[]>(() => {
    const out: Section[] = [];

    // Live entity results first.
    for (const g of groups) {
      out.push({
        group: g.group,
        items: g.items.map((it) => ({
          id: `${g.group}-${it.id}`,
          label: it.label,
          sublabel: it.sublabel,
          status: it.status,
          perform: () => run(() => router.push(it.href)),
        })),
      });
    }

    const matches = (hay: string) => !q || hay.toLowerCase().includes(q);

    const nav: Item[] = NAV_ITEMS.filter((n) =>
      matches(`${n.label} ${n.keywords ?? ""}`)
    ).map((n) => {
      const Icon = n.icon;
      return {
        id: `nav-${n.href}`,
        label: n.label,
        icon: <Icon className="size-4" />,
        hint: `g ${n.jump}`,
        perform: () => run(() => router.push(n.href)),
      };
    });
    if (nav.length) out.push({ group: "Jump to", items: nav });

    const actions: Item[] = [
      { id: "new-vehicle", label: "New vehicle", kw: "add create fleet", href: "/vehicles?new=1" },
      { id: "new-trip", label: "New trip", kw: "add create dispatch", href: "/trips?new=1" },
      { id: "new-driver", label: "New driver", kw: "add create people", href: "/drivers?new=1" },
      { id: "log-maintenance", label: "Log maintenance", kw: "add create service repair", href: "/maintenance?new=1" },
      { id: "log-expense", label: "Log fuel or expense", kw: "add create cost", href: "/expenses?new=1" },
    ]
      .filter((a) => matches(`${a.label} ${a.kw}`))
      .map((a) => ({
        id: a.id,
        label: a.label,
        icon: <Plus className="size-4" />,
        perform: () => run(() => router.push(a.href)),
      }));
    if (actions.length) out.push({ group: "Create", items: actions });

    const prefs: Item[] = [
      { id: "theme-light", label: "Light theme", kw: "appearance mode", icon: <Sun className="size-4" />, fn: () => setTheme("light") },
      { id: "theme-dark", label: "Dark theme", kw: "appearance mode", icon: <Moon className="size-4" />, fn: () => setTheme("dark") },
      { id: "theme-system", label: "System theme", kw: "appearance mode auto", icon: <Monitor className="size-4" />, fn: () => setTheme("system") },
      { id: "shortcuts", label: "Keyboard shortcuts", kw: "help keys hotkeys", icon: <Keyboard className="size-4" />, fn: openShortcuts },
    ]
      .filter((p) => matches(`${p.label} ${p.kw}`))
      .map((p) => ({
        id: p.id,
        label: p.label,
        icon: p.icon,
        perform: () => run(p.fn),
      }));
    if (prefs.length) out.push({ group: "Preferences", items: prefs });

    return out;
  }, [groups, q, router, run, setTheme]);

  const flat = React.useMemo(() => sections.flatMap((s) => s.items), [sections]);

  // Keep active index in range as the list changes.
  React.useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  // Scroll the active row into view.
  React.useEffect(() => {
    listRef.current
      ?.querySelector(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (flat.length ? (a + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flat[active]?.perform();
    }
  };

  let idx = -1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          aria-label="Command palette"
          className="fixed top-[12vh] left-1/2 z-50 flex max-h-[70vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          onKeyDown={onKeyDown}
        >
          {/* search field */}
          <div className="flex items-center gap-2.5 border-b px-3.5">
            {loading ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Search className="size-4 shrink-0 text-muted-foreground" />
            )}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vehicles, drivers, trips… or jump anywhere"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="kbd">Esc</kbd>
          </div>

          {/* results */}
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {flat.length === 0 ? (
              <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                {q ? (
                  <>No results for “{query}”.</>
                ) : (
                  <>Start typing to search across the fleet.</>
                )}
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.group} className="mb-1 last:mb-0">
                  <div className="px-2.5 pt-2 pb-1 text-[0.6875rem] font-medium tracking-wide text-muted-foreground/70 uppercase">
                    {section.group}
                  </div>
                  {section.items.map((item) => {
                    idx += 1;
                    const i = idx;
                    const isActive = i === active;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-idx={i}
                        onMouseMove={() => setActive(i)}
                        onClick={() => item.perform()}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                          isActive ? "bg-accent text-accent-foreground" : "text-foreground"
                        )}
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                          {item.status ? (
                            <StatusDot status={item.status} live={false} />
                          ) : (
                            item.icon ?? <ArrowRight className="size-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{item.label}</span>
                          {item.sublabel && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {item.sublabel}
                            </span>
                          )}
                        </span>
                        {item.hint && (
                          <span className="hidden shrink-0 gap-1 sm:flex">
                            {item.hint.split(" ").map((k, ki) => (
                              <kbd key={ki} className="kbd">
                                {k}
                              </kbd>
                            ))}
                          </span>
                        )}
                        {isActive && (
                          <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* footer */}
          <div className="flex items-center gap-3 border-t px-3.5 py-2 text-[0.6875rem] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="kbd">↑</kbd>
              <kbd className="kbd">↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="kbd">↵</kbd> open
            </span>
            <span className="ml-auto flex items-center gap-1">
              <kbd className="kbd">g</kbd> then a key to jump
            </span>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
