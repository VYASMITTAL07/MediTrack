"use client";

import { useCallback, useEffect, useState, type ComponentProps } from "react";
import { CalendarClock, ClipboardCheck, FileText, Stethoscope } from "lucide-react";
import { ConsultationForm } from "@/components/dashboard/consultation-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MedicalTimeline } from "@/components/dashboard/medical-timeline";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DoctorDashboardData = {
  stats: {
    todayAppointments: number;
    consultsCompleted: number;
    reportsPending: number;
    liveSlots: number;
  };
  appointments: ComponentProps<typeof ConsultationForm>["appointments"];
  medicalRecords: ComponentProps<typeof MedicalTimeline>["items"];
};

export default function DoctorPortal() {
  const [dashboard, setDashboard] = useState<DoctorDashboardData | null>(null);

  const loadDashboard = useCallback(async () => {
    const response = await fetch("/api/dashboard/doctor", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as DoctorDashboardData;
    setDashboard(data);
  }, []);

  useEffect(() => {
    loadDashboard();
    const interval = window.setInterval(loadDashboard, 30000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadDashboard();
    };
    window.addEventListener("meditrack:data-refresh", loadDashboard);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("meditrack:data-refresh", loadDashboard);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadDashboard]);

  const stats = dashboard?.stats;
  const appointments = dashboard?.appointments ?? [];

  return (
      <DashboardShell
        eyebrow="Doctor portal"
      title="Patient history and appointments."
      description="Review verified records, manage visits, add diagnoses, upload prescriptions, and save notes to the patient timeline."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarClock} label="Today appointments" value={`${stats?.todayAppointments ?? 0}`} detail="From confirmed database bookings" />
        <StatCard icon={ClipboardCheck} label="Consults completed" value={`${stats?.consultsCompleted ?? 0}`} detail="Synced to patient timelines" />
        <StatCard icon={FileText} label="Reports pending" value={`${stats?.reportsPending ?? 0}`} detail="Uploaded reports awaiting review" />
        <StatCard icon={Stethoscope} label="Live slots" value={`${stats?.liveSlots ?? 0}`} detail="Available slots from database" />
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
            {appointments.length === 0 && (
              <p className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                No appointments have been booked yet.
              </p>
            )}
            {appointments.slice(0, 6).map((appointment) => (
              <article key={appointment.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold">{appointment.patient.name}</h4>
                    <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                  </div>
                  <Badge>{appointment.slot.time}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>{appointment.status}</Badge>
                  <Badge>{appointment.patient.allergies.length} allergies</Badge>
                </div>
              </article>
            ))}
          </div>
        </Card>
        <ConsultationForm appointments={appointments} onSaved={loadDashboard} />
      </div>

      <div className="mt-6">
        <MedicalTimeline items={dashboard?.medicalRecords} />
      </div>
    </DashboardShell>
  );
}
