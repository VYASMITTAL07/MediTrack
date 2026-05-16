"use client";

import { useCallback, useEffect, useState, type ComponentProps } from "react";
import {
  Activity,
  Bell,
  CalendarCheck2,
  FileHeart,
  HeartPulse,
  ShieldCheck
} from "lucide-react";
import { AIChatPanel } from "@/components/dashboard/ai-chat-panel";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { AppointmentBoard } from "@/components/dashboard/appointment-board";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DiseaseAnalysis } from "@/components/dashboard/disease-analysis";
import { DoctorFinder } from "@/components/dashboard/doctor-finder";
import { EmergencySOS } from "@/components/dashboard/emergency-sos";
import { MedicalTimeline } from "@/components/dashboard/medical-timeline";
import { NearbyMap } from "@/components/dashboard/nearby-map";
import { PatientUpdates } from "@/components/dashboard/patient-updates";
import { ReportVerification } from "@/components/dashboard/report-verification";
import { StatCard } from "@/components/dashboard/stat-card";

type PatientDashboardData = {
  stats: {
    healthScore: number;
    verifiedRecords: number;
    upcomingVisits: number;
    notifications: number;
  };
  medicalRecords: ComponentProps<typeof MedicalTimeline>["items"];
  notifications: ComponentProps<typeof PatientUpdates>["notifications"];
  prescriptions: ComponentProps<typeof PatientUpdates>["prescriptions"];
  reports: ComponentProps<typeof PatientUpdates>["reports"];
};

export default function PatientPortal() {
  const [dashboard, setDashboard] = useState<PatientDashboardData | null>(null);

  const loadDashboard = useCallback(async () => {
    const response = await fetch("/api/dashboard/patient");
    if (!response.ok) return;
    const data = (await response.json()) as PatientDashboardData;
    setDashboard(data);
  }, []);

  useEffect(() => {
    loadDashboard();
    window.addEventListener("meditrack:data-refresh", loadDashboard);
    return () => window.removeEventListener("meditrack:data-refresh", loadDashboard);
  }, [loadDashboard]);

  const stats = dashboard?.stats;

  return (
      <DashboardShell
        eyebrow="Patient portal"
      title="Your health records in one place."
      description="Track medical history, check reports, discover nearby doctors, and book live appointments."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={HeartPulse} label="AI health score" value={`${stats?.healthScore ?? 0}/100`} detail="Loaded from patient profile" />
        <StatCard icon={FileHeart} label="Verified records" value={`${stats?.verifiedRecords ?? 0}`} detail="Medical records and verified reports" />
        <StatCard icon={CalendarCheck2} label="Upcoming visits" value={`${stats?.upcomingVisits ?? 0}`} detail="Confirmed appointments from database" />
        <StatCard icon={Bell} label="Smart reminders" value={`${stats?.notifications ?? 0}`} detail="Unread in-app notifications" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <AIChatPanel />
        <DiseaseAnalysis />
      </div>

      <div className="mt-6">
        <AppointmentBoard />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <MedicalTimeline items={dashboard?.medicalRecords} />
        <div className="grid gap-6">
          <AnalyticsChart />
          <ReportVerification onSaved={loadDashboard} />
          <PatientUpdates
            notifications={dashboard?.notifications}
            prescriptions={dashboard?.prescriptions}
            reports={dashboard?.reports}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <DoctorFinder />
        <div className="grid gap-6">
          <NearbyMap />
          <EmergencySOS />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <StatCard
          icon={ShieldCheck}
          label="Identity"
          value="MFA ready"
          detail="PIN, email, Aadhaar/passport, and face verification architecture"
        />
        <StatCard
          icon={Activity}
          label="Wearable stream"
          value="Connected"
          detail="Vitals can enrich AI health score and reminders"
        />
      </div>
    </DashboardShell>
  );
}
