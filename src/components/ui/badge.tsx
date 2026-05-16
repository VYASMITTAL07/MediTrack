import { cn } from "@/lib/utils";

export function Badge({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}
