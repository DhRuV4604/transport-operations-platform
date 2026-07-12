"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { VEHICLE_TYPES, VEHICLE_STATUS, REGIONS, STATUS_LABELS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

const FILTERS = [
  { key: "type", label: "Types", options: VEHICLE_TYPES.map((t) => ({ value: t, label: t })) },
  {
    key: "status",
    label: "Statuses",
    options: VEHICLE_STATUS.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
  },
  { key: "region", label: "Regions", options: REGIONS.map((r) => ({ value: r, label: r })) },
];

export function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === ALL) params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(qs ? `/dashboard?${qs}` : "/dashboard");
  };

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => (
        <Select
          key={f.key}
          value={searchParams.get(f.key) ?? ALL}
          onValueChange={(v) => setFilter(f.key, (v as string) ?? ALL)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder={f.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All {f.label}</SelectItem>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
