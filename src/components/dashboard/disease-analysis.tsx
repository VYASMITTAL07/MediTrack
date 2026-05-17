"use client";

import { useState, useTransition } from "react";
import { Brain, Gauge, Search, Stethoscope } from "lucide-react";
import { healthRiskColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedbackToast, type FeedbackToastState } from "@/components/ui/feedback-toast";

type DoctorSummary = {
  id: string;
  name: string;
  specialty: string;
};

type Analysis = {
  severity: string;
  urgencyLevel: string;
  healthRiskScore: number;
  possibleDiseases: string[];
  recommendedSpecializations: string[];
  recommendedDoctors?: DoctorSummary[];
  nearbyClinics: string[];
  precautions: string[];
  ratingSystem: {
    urgency: number;
    specialistMatch: number;
    followUpNeed: number;
  };
  disclaimer: string;
};

export function DiseaseAnalysis() {
  const [symptoms, setSymptoms] = useState("Fever with cough for 3 days");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<FeedbackToastState>(null);

  function showFeedback(nextFeedback: FeedbackToastState) {
    setFeedback(nextFeedback);
    window.setTimeout(() => setFeedback(null), 3600);
  }

  function analyze() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symptoms,
            location: "Mumbai",
            knownConditions: ["Penicillin allergy"]
          })
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to analyze symptoms.");
        }
        setAnalysis(data);
      } catch (error) {
        showFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Unable to analyze symptoms."
        });
      }
    });
  }

  return (
    <Card>
      <FeedbackToast feedback={feedback} />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Symptom review
          </p>
          <h3 className="mt-2 text-2xl font-bold">Check urgency and next steps</h3>
        </div>
        <Brain className="size-8 text-primary" />
      </div>

      <textarea
        value={symptoms}
        onChange={(event) => setSymptoms(event.target.value)}
        rows={4}
        className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
        placeholder="Enter symptoms, duration, severity, existing conditions..."
      />
      <Button className="mt-4 w-full rounded-md" disabled={isPending} onClick={analyze}>
        <Search className="mr-2 size-4" />
        {isPending ? "Checking symptoms..." : "Check symptoms"}
      </Button>

      {analysis && (
        <div className="mt-6 grid gap-4">
          <div className="rounded-lg border border-border bg-background p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Health risk score</p>
                <p className={`mt-1 text-5xl font-bold ${healthRiskColor(100 - analysis.healthRiskScore)}`}>
                  {analysis.healthRiskScore}
                </p>
              </div>
              <div className="grid gap-2 text-sm">
                <Badge>
                  <Gauge className="mr-2 size-4" />
                  {analysis.severity} severity
                </Badge>
                <Badge className="text-amber-300">{analysis.urgencyLevel} urgency</Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(analysis.ratingSystem).map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {label.replace(/([A-Z])/g, " $1")}
                </p>
                <p className="mt-2 text-3xl font-bold">{value}/5</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <List title="Possible conditions" items={analysis.possibleDiseases} />
            <List title="Precautions" items={analysis.precautions} />
          </div>

          <div>
            <p className="mb-3 flex items-center gap-2 font-bold">
              <Stethoscope className="size-5 text-primary" />
              Recommended doctors
            </p>
            <div className="grid gap-2">
              {(analysis.recommendedDoctors ?? []).slice(0, 3).map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3"
                >
                  <span className="font-semibold">{doctor.name}</span>
                  <Badge>{doctor.specialty}</Badge>
                </div>
              ))}
              {(analysis.recommendedDoctors ?? []).length === 0 && (
                <p className="rounded-md border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                  No matching verified doctors found yet.
                </p>
              )}
            </div>
          </div>

          <p className="rounded-md bg-primary/10 p-3 text-xs leading-5 text-muted-foreground">
            {analysis.disclaimer}
          </p>
        </div>
      )}
    </Card>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="font-bold">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <p key={item} className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
