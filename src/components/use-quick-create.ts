"use client";

import { useEffect } from "react";

/**
 * Opens a create dialog when the page is reached with `?new=1` — the deep link
 * the command palette's "New …" actions use. Strips the param via history so a
 * refresh or back-nav won't reopen it. Client-only; no Suspense boundary needed.
 */
export function useQuickCreate(setOpen: (open: boolean) => void) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("new") === "1") {
      setOpen(true);
      url.searchParams.delete("new");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }, [setOpen]);
}
