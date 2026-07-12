"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/components/nav-config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function isTypingTarget(el: EventTarget | null) {
  const n = el as HTMLElement | null;
  if (!n) return false;
  return (
    n.tagName === "INPUT" ||
    n.tagName === "TEXTAREA" ||
    n.tagName === "SELECT" ||
    n.isContentEditable
  );
}

const GENERAL: [string[], string][] = [
  [["⌘", "K"], "Open command palette & search"],
  [["/"], "Focus search"],
  [["?"], "Show this cheat sheet"],
  [["g", "then key"], "Jump to a section"],
  [["Esc"], "Close dialogs"],
];

/**
 * Power-user keyboard layer: `g` then a section key jumps anywhere, `?` opens
 * the cheat sheet. Never fires while typing in a field.
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = React.useState(false);
  const pendingG = React.useRef(0);

  React.useEffect(() => {
    const onOpenHelp = () => setHelpOpen(true);
    window.addEventListener("shortcuts:open", onOpenHelp);

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      // "/" focuses search by opening the palette
      if (e.key === "/") {
        e.preventDefault();
        window.dispatchEvent(new Event("command-menu:open"));
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      const now = Date.now();
      if (e.key === "g") {
        pendingG.current = now;
        return;
      }
      if (now - pendingG.current < 1200) {
        const item = NAV_ITEMS.find((n) => n.jump === e.key.toLowerCase());
        if (item) {
          e.preventDefault();
          pendingG.current = 0;
          router.push(item.href);
          return;
        }
      }
      pendingG.current = 0;
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("shortcuts:open", onOpenHelp);
      window.removeEventListener("keydown", onKey);
    };
  }, [router]);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Move through TransitOps without touching the mouse.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              General
            </p>
            <ul className="space-y-1.5">
              {GENERAL.map(([keys, label]) => (
                <li key={label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="flex shrink-0 gap-1">
                    {keys.map((k) => (
                      <kbd key={k} className="kbd">
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Jump to
            </p>
            <ul className="space-y-1.5">
              {NAV_ITEMS.map((n) => (
                <li key={n.href} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{n.label}</span>
                  <span className="flex shrink-0 gap-1">
                    <kbd className="kbd">g</kbd>
                    <kbd className="kbd">{n.jump}</kbd>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
