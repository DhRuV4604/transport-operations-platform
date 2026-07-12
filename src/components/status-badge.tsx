import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  AVAILABLE: "bg-success/15 text-success border-transparent",
  ON_TRIP: "bg-info/15 text-info border-transparent",
  IN_SHOP: "bg-warning/15 text-warning border-transparent",
  RETIRED: "bg-muted text-muted-foreground border-transparent",
  OFF_DUTY: "bg-muted text-muted-foreground border-transparent",
  SUSPENDED: "bg-destructive/15 text-destructive border-transparent",
  DRAFT: "bg-muted text-muted-foreground border-transparent",
  DISPATCHED: "bg-info/15 text-info border-transparent",
  COMPLETED: "bg-success/15 text-success border-transparent",
  CANCELLED: "bg-destructive/15 text-destructive border-transparent",
  OPEN: "bg-warning/15 text-warning border-transparent",
  CLOSED: "bg-success/15 text-success border-transparent",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[status])}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
