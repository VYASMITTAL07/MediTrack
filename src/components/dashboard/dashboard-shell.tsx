import { Badge } from "@/components/ui/badge";

export function DashboardShell({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen px-4 pb-16 pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 max-w-4xl">
          <Badge>{eyebrow}</Badge>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-normal md:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            {description}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}
