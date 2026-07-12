import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "default" | "primary" | "success" | "warning" | "info" | "destructive";

const TONE_VAR: Record<Tone, string> = {
  default: "var(--color-muted-foreground)",
  primary: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  info: "var(--color-info)",
  destructive: "var(--color-destructive)",
};

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  delta,
  href,
  progress,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  tone?: Tone;
  delta?: { value: string; direction: "up" | "down" | "flat"; good?: boolean };
  href?: string;
  /** 0–100. Renders a single-series meter under the value (e.g. utilization). */
  progress?: number;
}) {
  const color = TONE_VAR[tone];
  const alert = tone === "warning" || tone === "destructive";

  const DeltaIcon =
    delta?.direction === "up" ? ArrowUpRight : delta?.direction === "down" ? ArrowDownRight : Minus;
  // `good` overrides semantics; default: up is good.
  const deltaGood = delta ? (delta.good ?? delta.direction === "up") : false;

  const body = (
    <>
      {/* tone accent rail */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-0.5 rounded-r-full opacity-70"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className="grid size-8 shrink-0 place-items-center rounded-lg"
            style={{
              color,
              backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)`,
            }}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span
          className={cn(
            "text-3xl leading-none font-semibold tabular-nums tracking-tight",
            alert && "text-[var(--tone)]"
          )}
          style={alert ? ({ ["--tone" as string]: color } as React.CSSProperties) : undefined}
        >
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              "mb-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
              deltaGood
                ? "bg-success/12 text-success"
                : delta.direction === "flat"
                  ? "bg-muted text-muted-foreground"
                  : "bg-destructive/12 text-destructive"
            )}
          >
            <DeltaIcon className="size-3" />
            {delta.value}
          </span>
        )}
      </div>
      {typeof progress === "number" && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
      {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
    </>
  );

  const className = cn(
    "group relative flex flex-col overflow-hidden rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 transition-shadow",
    href && "hover:ring-foreground/20 hover:shadow-sm"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}
