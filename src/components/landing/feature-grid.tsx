import { featureCards } from "@/lib/data";
import { Card } from "@/components/ui/card";

export function FeatureGrid() {
  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
            Main features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal md:text-4xl">
            Everything a small clinic needs on one clear screen.
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            The interface is now quieter: fewer effects, clearer labels, and
            faster scanning for everyday hospital work.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <Card key={feature.title} className="h-full">
              <div className="mb-5 grid size-11 place-items-center rounded-md bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </div>
              <h3 className="text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
