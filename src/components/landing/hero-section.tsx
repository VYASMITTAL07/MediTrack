import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { platformStats } from "@/lib/data";

export function HeroSection() {
  return (
    <section className="relative min-h-[86vh] overflow-hidden">
      <Image
        src="/images/hospital-corridor.webp"
        alt="Clean hospital corridor"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/50" />

      <div className="relative mx-auto flex min-h-[86vh] max-w-7xl flex-col justify-end px-4 pb-10 pt-28 text-white">
        <div className="max-w-3xl pb-8">
          <Badge className="border-white/25 bg-white/15 text-white">
            Medical records, appointments, and care access
          </Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
            Simple medical records for patients, doctors, and clinics.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
            Keep patient history, reports, appointments, and doctor notes in one
            clean workspace without the noisy dashboard look.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/patient/login">
                Patient Login
                <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="bg-white text-slate-900 hover:bg-white/90">
              <Link href="/appointments">
                <CalendarDays className="mr-2 size-5" />
                Book Appointment
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/20 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          {platformStats.map((stat) => (
            <div key={stat.label} className="rounded-lg bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="mt-1 text-sm font-semibold">{stat.label}</p>
              <p className="mt-1 text-xs leading-5 text-white/75">{stat.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/85">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4" />
            Role based access
          </span>
          <span className="inline-flex items-center gap-2">
            <FileText className="size-4" />
            Verified report history
          </span>
        </div>
      </div>
    </section>
  );
}
