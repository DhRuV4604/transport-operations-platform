import { cn } from "@/lib/utils";

/**
 * TransitOps mark — a teal tile holding a routed path: a waypoint that moves
 * up-and-forward into an arrow. Motion, direction, fleet. Scale via `className`
 * (e.g. `size-6`); the glyph tracks the tile.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-6 text-primary", className)}
      role="img"
      aria-label="TransitOps"
    >
      <rect width="24" height="24" rx="6" fill="currentColor" />
      <g
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7.5 16.5 L16.5 7.5" />
        <path d="M12 7.5 L16.5 7.5 L16.5 12" />
      </g>
      <circle cx="7.5" cy="16.5" r="1.9" fill="var(--primary-foreground)" />
    </svg>
  );
}

/** Full lockup — mark + wordmark. Tight tracking, sentence-case product name. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="size-6" />
      <span className="text-[0.95rem] font-semibold tracking-tighter">
        Transit<span className="text-primary">Ops</span>
      </span>
    </span>
  );
}
