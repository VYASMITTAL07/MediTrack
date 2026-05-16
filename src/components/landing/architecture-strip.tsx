import { LockKeyhole, Radio, ScanSearch, ServerCog } from "lucide-react";
import { Card } from "@/components/ui/card";

const layers = [
  {
    icon: LockKeyhole,
    title: "Security",
    detail: "JWT sessions, PIN verification, MFA-ready flows, RBAC guards, PHI encryption strategy."
  },
  {
    icon: ServerCog,
    title: "Data",
    detail: "PostgreSQL models with indexed appointments, records, AI consults, reports, doctors, and clinics."
  },
  {
    icon: Radio,
    title: "Realtime",
    detail: "Socket.io rooms broadcast slot holds, releases, bookings, and queue updates."
  },
  {
    icon: ScanSearch,
    title: "Verification",
    detail: "Report checks, symptom review, and local fallback responses for demo readiness."
  }
];

export function ArchitectureStrip() {
  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <Card className="overflow-hidden">
          <div className="grid gap-6 lg:grid-cols-4">
            {layers.map((layer) => (
              <div key={layer.title} className="relative">
                <div className="mb-5 grid size-11 place-items-center rounded-md bg-primary/10 text-primary">
                  <layer.icon className="size-6" />
                </div>
                <h3 className="text-xl font-bold">{layer.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{layer.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
