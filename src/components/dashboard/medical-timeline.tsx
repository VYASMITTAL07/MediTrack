"use client";

import { CheckCircle2, FileText } from "lucide-react";
import { medicalTimeline } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TimelineItem = {
  id?: string;
  date: string;
  title: string;
  type: string;
  summary: string;
  verified: boolean;
  aiSummary: string;
};

export function MedicalTimeline({ items = medicalTimeline }: { items?: TimelineItem[] }) {
  return (
    <Card>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Patient record
          </p>
          <h3 className="mt-2 text-2xl font-bold">Medical history</h3>
        </div>
        <Badge>
          <CheckCircle2 className="mr-2 size-4 text-emerald-600" />
          Chronological
        </Badge>
      </div>

      <div className="space-y-4">
        {items.length === 0 && (
          <p className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
            No medical records have been saved yet.
          </p>
        )}
        {items.map((item) => (
          <article key={item.id ?? `${item.date}-${item.title}`} className="rounded-lg border border-border bg-background p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{item.type}</Badge>
              {item.verified && (
                <Badge className="text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="mr-1.5 size-3.5" />
                  Verified
                </Badge>
              )}
            </div>
            <h4 className="mt-3 text-lg font-bold">{item.title}</h4>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {formatDateTime(item.date)}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.summary}</p>
            <p className="mt-3 flex items-start gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
              <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
              {item.aiSummary}
            </p>
          </article>
        ))}
      </div>
    </Card>
  );
}
