import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Bot, Building2, UserRound, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";

const portals = [
  {
    href: "/patient/login",
    icon: UserRound,
    title: "Patient",
    copy: "View health history, reports, appointments, reminders, and doctor notes."
  },
  {
    href: "/doctor/login",
    icon: UsersRound,
    title: "Doctor",
    copy: "Check appointments, patient timeline, prescriptions, and visit notes."
  },
  {
    href: "/admin/login",
    icon: Building2,
    title: "Admin",
    copy: "Review doctors, clinics, reports, access controls, and activity queues."
  },
  {
    href: "/ai-consult",
    icon: Bot,
    title: "Assistant",
    copy: "Summarize symptoms and records with clear safety disclaimers."
  }
];

export function PortalShowcase() {
  return (
    <section className="px-4 py-14">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-border">
          <Image
            src="/images/hospital-room.webp"
            alt="Hospital room"
            fill
            className="object-cover"
          />
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
            Portals
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal md:text-4xl">
            Separate access for each role.
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Patients, doctors, and admins get focused pages instead of one crowded
            dashboard. Each action points back to the patient record.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {portals.map((portal) => (
              <Link key={portal.title} href={portal.href}>
                <Card className="group h-full">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
                      <portal.icon className="size-5" />
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{portal.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{portal.copy}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
