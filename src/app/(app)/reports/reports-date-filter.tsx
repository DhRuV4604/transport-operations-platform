"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";
const PRESETS = [
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
];

function currentPreset(searchParams: URLSearchParams) {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) return ALL;
  const days = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
  return PRESETS.find((p) => Number(p.key) === days)?.key ?? ALL;
}

export function ReportsDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setPreset = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === ALL) {
      params.delete("from");
      params.delete("to");
    } else {
      const to = new Date();
      const from = subDays(to, Number(value));
      params.set("from", format(from, "yyyy-MM-dd"));
      params.set("to", format(to, "yyyy-MM-dd"));
    }
    const qs = params.toString();
    router.replace(qs ? `/reports?${qs}` : "/reports");
  };

  return (
    <Select value={currentPreset(searchParams)} onValueChange={(v) => setPreset(v as string)}>
      <SelectTrigger className="w-40 print:hidden">
        <SelectValue placeholder="Date range">
          {(value) =>
            !value || value === ALL
              ? "All time"
              : (PRESETS.find((p) => p.key === value)?.label ?? String(value))
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All time</SelectItem>
        {PRESETS.map((p) => (
          <SelectItem key={p.key} value={p.key}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
