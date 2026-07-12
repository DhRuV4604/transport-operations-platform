import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-transparent",
  ON_TRIP: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-transparent",
  IN_SHOP: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-transparent",
  RETIRED: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-transparent",
  OFF_DUTY: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-transparent",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-transparent",
  DRAFT: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-transparent",
  DISPATCHED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-transparent",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-transparent",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-transparent",
  OPEN: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-transparent",
  CLOSED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-transparent",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[status])}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
