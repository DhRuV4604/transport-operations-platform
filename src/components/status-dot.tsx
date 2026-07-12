import { STATUS_LABELS } from "@/lib/constants";
import { toneFor, TONE_VAR, TONE_IS_LIVE } from "@/lib/status";
import { cn } from "@/lib/utils";

/**
 * A single status glyph: a colored dot keyed to the status tone. "Moving"
 * states (on trip, dispatched) get a live ping. Hover shows the label.
 */
export function StatusDot({
  status,
  className,
  live = true,
}: {
  status: string;
  className?: string;
  live?: boolean;
}) {
  const tone = toneFor(status);
  const color = TONE_VAR[tone];
  const isLive = live && TONE_IS_LIVE[tone];

  return (
    <span
      className={cn("relative inline-flex size-2.5 shrink-0", className)}
      title={STATUS_LABELS[status] ?? status}
    >
      {isLive && (
        <span
          className="absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:hidden"
          style={{ background: color }}
        />
      )}
      <span
        className="relative size-2.5 rounded-full ring-2 ring-[var(--card)]"
        style={{ background: color }}
      />
    </span>
  );
}
