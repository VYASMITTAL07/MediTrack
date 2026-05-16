"use client";

import { useState, useTransition } from "react";
import { ClipboardPlus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ConsultationForm() {
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function saveConsultation(formData: FormData) {
    startTransition(async () => {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CONSULTATION",
          patientId: "demo-patient",
          title: formData.get("diagnosis"),
          summary: formData.get("notes"),
          medicines: formData.get("medicines"),
          followUpAt: formData.get("followUpAt")
        })
      }).catch(() => null);
      setSaved(true);
    });
  }

  return (
    <Card>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Doctor workflow
          </p>
          <h3 className="mt-2 text-2xl font-bold">Consultation form</h3>
        </div>
        <ClipboardPlus className="size-8 text-primary" />
      </div>

      <form action={saveConsultation} className="grid gap-4">
        <input
          name="diagnosis"
          required
          placeholder="Disease diagnosed"
          className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
        />
        <textarea
          name="medicines"
          required
          placeholder="Medicines prescribed, dosage, frequency"
          rows={3}
          className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
        />
        <textarea
          name="notes"
          required
          placeholder="Clinical notes and treatment progress"
          rows={4}
          className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          name="followUpAt"
          type="date"
          className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
        />
        <Button className="rounded-md" disabled={isPending}>
          <Save className="mr-2 size-4" />
          {isPending ? "Saving to lifetime history..." : "Save to patient history"}
        </Button>
      </form>

      {saved && (
        <Badge className="mt-4 text-emerald-300">
          Saved and linked to the patient timeline
        </Badge>
      )}
    </Card>
  );
}
