import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  className
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  className?: string;
}) {
  return (
    <div className={cn("glass-panel rounded-lg p-5", className)}>
      <div className="mb-5 flex items-center justify-between">
        <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
          Live
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
