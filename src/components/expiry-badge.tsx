import { differenceInDays, format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function ExpiryBadge({ date, warnDays = 30 }: { date: Date; warnDays?: number }) {
  const days = differenceInDays(date, new Date());
  const label = format(date, "dd MMM yyyy");
  if (days < 0) {
    return (
      <Badge className="bg-destructive/15 text-destructive border-transparent">
        Expired · {label}
      </Badge>
    );
  }
  if (days <= warnDays) {
    return (
      <Badge className="bg-warning/15 text-warning border-transparent">
        {days}d left · {label}
      </Badge>
    );
  }
  return <span>{label}</span>;
}
