import { differenceInDays, format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function ExpiryBadge({ date, warnDays = 30 }: { date: Date; warnDays?: number }) {
  const days = differenceInDays(date, new Date());
  const label = format(date, "dd MMM yyyy");
  if (days < 0) {
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-transparent">
        Expired · {label}
      </Badge>
    );
  }
  if (days <= warnDays) {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-transparent">
        {days}d left · {label}
      </Badge>
    );
  }
  return <span>{label}</span>;
}
