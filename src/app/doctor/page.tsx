"use client";

import { CalendarClock, ClipboardCheck, FileText, Stethoscope } from "lucide-react";
import { ConsultationForm } from "@/components/dashboard/consultation-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MedicalTimeline } from "@/components/dashboard/medical-timeline";
import { StatCard } from "@/components/dashboard/stat-card";
import { doctorTasks } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DoctorPortal() {
  return (
      <DashboardShell
        eyebrow="Doctor portal"
      title="Patient history and appointments."
      description="Review verified records, manage visits, add diagnoses, upload prescriptions, and save notes to the patient timeline."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarClock} label="Today appointments" value="18" detail="3 high priority, 5 virtual" />
        <StatCard icon={ClipboardCheck} label="Consults completed" value="9" detail="All synced to patient timelines" />
        <StatCard icon={FileText} label="Reports pending" value="6" detail="AI summarized before review" />
        <StatCard icon={Stethoscope} label="Live slots" value="24" detail="Synced with realtime engine" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <Card>
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
              Queue management
            </p>
            <h3 className="mt-2 text-2xl font-bold">Today&apos;s smart schedule</h3>
          </div>
          <div className="grid gap-4">
            {doctorTasks.map((task) => (
              <article key={`${task.patient}-${task.time}`} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold">{task.patient}</h4>
                    <p className="text-sm text-muted-foreground">{task.reason}</p>
                  </div>
                  <Badge>{task.time}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className={task.risk === "High" ? "text-rose-300" : "text-emerald-300"}>
                    {task.risk} risk
                  </Badge>
                  <Badge>{task.record}</Badge>
                </div>
              </article>
            ))}
          </div>
        </Card>
        <ConsultationForm />
      </div>

      <div className="mt-6">
        <MedicalTimeline />
      </div>
    </DashboardShell>
  );
}
