"use client";

import { Activity, ClipboardCheck, Building2, ShieldAlert } from "lucide-react";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminQueues, liveMetrics } from "@/lib/data";

export default function AdminPortal() {
  return (
      <DashboardShell
        eyebrow="Admin portal"
      title="Clinic and record operations."
      description="Approve registrations, verify licenses, review suspicious reports, and monitor healthcare network activity."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Building2} label="Clinics monitored" value="184" detail="37 pending deeper verification" />
        <StatCard icon={ShieldAlert} label="Fraud risk alerts" value="7" detail="Report manipulation review queue" />
      <StatCard icon={ClipboardCheck} label="Review accuracy" value="99.2%" detail="Response and report compliance" />
        <StatCard icon={Activity} label="Network uptime" value="99.98%" detail="Realtime booking and APIs healthy" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <Card>
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
              Approval queues
            </p>
            <h3 className="mt-2 text-2xl font-bold">Verification queue</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {adminQueues.map((queue) => (
              <article key={queue.label} className="rounded-lg border border-border bg-background p-5">
                <queue.icon className={`size-7 ${queue.tone}`} />
                <p className="mt-5 text-4xl font-bold">{queue.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{queue.label}</p>
              </article>
            ))}
          </div>
        </Card>
        <AnalyticsChart />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Live product metrics
          </p>
          <div className="mt-6 grid gap-3">
            {liveMetrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div>
                  <p className="font-bold">{metric.label}</p>
                  <p className="text-sm text-muted-foreground">Across patient, doctor, and admin portals</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <Badge className="text-emerald-300">{metric.delta}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Suspicious activity
          </p>
          <div className="mt-6 space-y-3">
            {["MRI upload metadata mismatch", "License expiry needs renewal", "Repeated OTP failures", "Unusual report edit pattern"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-4">
                <span className="font-semibold">{item}</span>
                <Badge className="text-amber-300">Review</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
