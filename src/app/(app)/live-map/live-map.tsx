"use client";

import { useEffect, useRef, useState } from "react";
import { Truck, Bike, Package, MapPin, Navigation, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MAP_VIEWBOX } from "@/lib/geo";
import { INDIA_SILHOUETTE } from "@/lib/india-map";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type LiveTrip = {
  id: string;
  source: string;
  destination: string;
  vehicleReg: string;
  vehicleName: string;
  vehicleType: string;
  driverName: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  revenue: number;
  dispatchedAt: string | null;
  from: { x: number; y: number };
  to: { x: number; y: number };
};

// The India outline (accurate, public-domain, projected to match geo.ts) lives
// in india-map.ts and is imported as INDIA_SILHOUETTE.

// Unique city labels/points drawn from the live routes, so every dot anchors a
// real endpoint and lines up exactly with a route.
function cityDots(trips: LiveTrip[]) {
  const seen = new Map<string, { x: number; y: number }>();
  for (const t of trips) {
    if (!seen.has(t.source)) seen.set(t.source, t.from);
    if (!seen.has(t.destination)) seen.set(t.destination, t.to);
  }
  return [...seen].map(([name, p]) => ({ name, ...p }));
}

function vehicleIcon(type: string) {
  if (type === "BIKE") return Bike;
  if (type === "VAN") return Package;
  return Truck;
}

// Position along the route [0..1], eased so vehicles slow near the endpoints —
// gives the icons a gentle "cruising" feel rather than a constant crawl.
function eased(t: number) {
  return 0.5 - Math.cos(Math.PI * t) / 2;
}

export function LiveMap({ trips }: { trips: LiveTrip[] }) {
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<string | null>(trips[0]?.id ?? null);
  const raf = useRef<number>(0);

  // Drive a shared 0..1 clock (~18s loop). Each trip is offset by its index so
  // the fleet doesn't move in lockstep. Respects reduced-motion.
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setProgress(0.5);
      return;
    }
    const period = 18000;
    const start = performance.now();
    const tick = (now: number) => {
      setProgress(((now - start) % period) / period);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const active = trips.find((t) => t.id === selected) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <Card className="relative overflow-hidden p-0 ring-foreground/10">
        {/* Map surface */}
        <div className="relative aspect-[500/620] w-full bg-gradient-to-b from-muted/40 to-background">
          <svg
            viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
            className="h-full w-full"
            role="img"
            aria-label="Map of ongoing trips across India"
          >
            <defs>
              <pattern
                id="grid"
                width="28"
                height="28"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M28 0 L0 0 0 28"
                  fill="none"
                  className="stroke-foreground/[0.035]"
                  strokeWidth="1"
                />
              </pattern>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Soft halo around the landmass so it lifts off the background */}
              <filter id="landglow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>

            <rect
              width={MAP_VIEWBOX.width}
              height={MAP_VIEWBOX.height}
              fill="url(#grid)"
            />

            {/* Country outline: a blurred glow copy underneath, then the filled
                districts whose thin strokes read as internal borders */}
            <path
              d={INDIA_SILHOUETTE}
              className="fill-primary/20"
              filter="url(#landglow)"
            />
            <path
              d={INDIA_SILHOUETTE}
              className="fill-primary/[0.07] stroke-primary/25"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />

            {/* City dots derived from live routes */}
            {cityDots(trips).map((c) => (
              <g key={c.name}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="2.5"
                  className="fill-muted-foreground/50"
                />
                <text
                  x={c.x + 6}
                  y={c.y + 3}
                  className="fill-muted-foreground text-[9px]"
                >
                  {c.name}
                </text>
              </g>
            ))}

            {/* Routes + moving vehicles */}
            {trips.map((t, i) => {
              const isSel = t.id === selected;
              const local = eased((progress + i / trips.length) % 1);
              const vx = t.from.x + (t.to.x - t.from.x) * local;
              const vy = t.from.y + (t.to.y - t.from.y) * local;
              const angle =
                (Math.atan2(t.to.y - t.from.y, t.to.x - t.from.x) * 180) /
                Math.PI;
              const Icon = vehicleIcon(t.vehicleType);
              return (
                <g
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  className="cursor-pointer"
                >
                  {/* route line */}
                  <line
                    x1={t.from.x}
                    y1={t.from.y}
                    x2={t.to.x}
                    y2={t.to.y}
                    className={cn(
                      isSel ? "stroke-primary" : "stroke-info/60",
                    )}
                    strokeWidth={isSel ? 2.5 : 1.5}
                    strokeDasharray="5 5"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="10"
                      to="0"
                      dur="0.9s"
                      repeatCount="indefinite"
                    />
                  </line>

                  {/* endpoints */}
                  <circle
                    cx={t.from.x}
                    cy={t.from.y}
                    r="3"
                    className="fill-info"
                  />
                  <circle
                    cx={t.to.x}
                    cy={t.to.y}
                    r="4"
                    className={cn(
                      "fill-background",
                      isSel ? "stroke-primary" : "stroke-info",
                    )}
                    strokeWidth="2"
                  />

                  {/* moving vehicle */}
                  <g
                    transform={`translate(${vx} ${vy})`}
                    filter={isSel ? "url(#glow)" : undefined}
                  >
                    <circle
                      r="9"
                      className={cn(
                        isSel ? "fill-primary" : "fill-info",
                      )}
                    />
                    {/* rotate a small arrow to face travel direction */}
                    <g transform={`rotate(${angle})`}>
                      <Navigation
                        x={-5}
                        y={-5}
                        width={10}
                        height={10}
                        className="fill-primary-foreground stroke-primary-foreground"
                      />
                    </g>
                    <Icon
                      x={-6}
                      y={-20}
                      width={12}
                      height={12}
                      className={cn(
                        isSel ? "stroke-primary" : "stroke-info",
                      )}
                    />
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Overlay: live count */}
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs font-medium shadow-sm ring-1 ring-foreground/10 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-info opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-info" />
            </span>
            {trips.length} vehicle{trips.length === 1 ? "" : "s"} on the road
          </div>

          {trips.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="rounded-lg bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur">
                No trips are currently dispatched.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Trip list / detail panel */}
      <div className="flex flex-col gap-2">
        {trips.map((t) => {
          const Icon = vehicleIcon(t.vehicleType);
          const isSel = t.id === selected;
          return (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                isSel
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-card ring-1 ring-foreground/10 hover:bg-accent",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  isSel ? "bg-primary text-primary-foreground" : "bg-info/15 text-info",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <span className="truncate">{t.source}</span>
                  <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="truncate">{t.destination}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {t.vehicleReg} · {t.driverName}
                </p>
                {isSel && (
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <Detail label="Cargo" value={`${t.cargoWeightKg.toLocaleString()} kg`} />
                    <Detail label="Distance" value={`${t.plannedDistanceKm.toLocaleString()} km`} />
                    <Detail label="Revenue" value={`₹${t.revenue.toLocaleString()}`} />
                    <Detail label="Vehicle" value={t.vehicleName} />
                    {t.dispatchedAt && (
                      <div className="col-span-2 flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        dispatched {formatDistanceToNow(new Date(t.dispatchedAt), { addSuffix: true })}
                      </div>
                    )}
                  </dl>
                )}
              </div>
            </button>
          );
        })}
        {trips.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Dispatched trips will appear here.
          </p>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
