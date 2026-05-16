"use client";

import { Bell, FileText, Pill } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

type PrescriptionItem = {
  id: string;
  diagnosis: string;
  instructions: string;
  createdAt: string;
  doctorName: string;
};

type ReportItem = {
  id: string;
  title: string;
  verificationStatus: string;
  uploadedAt: string;
};

export function PatientUpdates({
  notifications = [],
  prescriptions = [],
  reports = []
}: {
  notifications?: NotificationItem[];
  prescriptions?: PrescriptionItem[];
  reports?: ReportItem[];
}) {
  return (
    <Card>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Updates
        </p>
        <h3 className="mt-2 text-2xl font-bold">Notifications and prescriptions</h3>
      </div>

      <div className="grid gap-4">
        <section>
          <div className="mb-2 flex items-center gap-2 font-bold">
            <Bell className="size-4 text-primary" />
            Notifications
          </div>
          <div className="grid gap-2">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="rounded-md border border-border bg-background p-3">
                <p className="font-semibold">{notification.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
                No notifications yet.
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2 font-bold">
            <Pill className="size-4 text-primary" />
            Prescriptions
          </div>
          <div className="grid gap-2">
            {prescriptions.slice(0, 3).map((prescription) => (
              <div key={prescription.id} className="rounded-md border border-border bg-background p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold">{prescription.diagnosis}</p>
                  <Badge>{prescription.doctorName}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{prescription.instructions}</p>
              </div>
            ))}
            {prescriptions.length === 0 && (
              <p className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
                No prescriptions saved yet.
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2 font-bold">
            <FileText className="size-4 text-primary" />
            Uploaded reports
          </div>
          <div className="grid gap-2">
            {reports.slice(0, 3).map((report) => (
              <div key={report.id} className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                <p className="font-semibold">{report.title}</p>
                <Badge>{report.verificationStatus}</Badge>
              </div>
            ))}
            {reports.length === 0 && (
              <p className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
                No uploaded reports yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </Card>
  );
}
