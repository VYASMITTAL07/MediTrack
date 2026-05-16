"use client";

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
import { ReportVerification } from "@/components/dashboard/report-verification";
import { StatCard } from "@/components/dashboard/stat-card";

export default function PatientPortal() {
  return (
      <DashboardShell
        eyebrow="Patient portal"
      title="Your health records in one place."
      description="Track medical history, check reports, discover nearby doctors, and book live appointments."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={HeartPulse} label="AI health score" value="84/100" detail="Up 6 points after verified labs" />
        <StatCard icon={FileHeart} label="Verified records" value="128" detail="Vaccines, labs, scans, consults" />
        <StatCard icon={CalendarCheck2} label="Upcoming visits" value="3" detail="1 cardiology, 2 follow-ups" />
        <StatCard icon={Bell} label="Smart reminders" value="11" detail="Medicine, diet, report checks" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <AIChatPanel />
        <DiseaseAnalysis />
      </div>

      <div className="mt-6">
        <AppointmentBoard />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <MedicalTimeline />
        <div className="grid gap-6">
          <AnalyticsChart />
          <ReportVerification />
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
