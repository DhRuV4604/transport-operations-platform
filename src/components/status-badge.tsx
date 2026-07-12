import { STATUS_LABELS } from "@/lib/constants";
import { toneFor, TONE_VAR } from "@/lib/status";
import { cn } from "@/lib/utils";

/**
 * Status pill — a tone-tinted chip with a matching dot. One tone drives both
 * the fill and the dot, so every status reads consistently across the app.
 */
export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const color = TONE_VAR[toneFor(status)];
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit items-center gap-1.5 rounded-full px-2 text-xs font-medium whitespace-nowrap",
        className
      )}
      style={{
        color,
        backgroundColor: `color-mix(in oklch, ${color} 14%, transparent)`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
