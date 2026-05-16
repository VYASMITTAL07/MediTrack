"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ClipboardPlus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedbackToast, type FeedbackToastState } from "@/components/ui/feedback-toast";

type ConsultationAppointment = {
  id: string;
  reason: string;
  status: string;
  patient: {
    name: string;
    allergies: string[];
  };
  slot: {
    startsAt: string;
    time: string;
  };
};

export function ConsultationForm({
  appointments = [],
  onSaved
}: {
  appointments?: ConsultationAppointment[];
  onSaved?: () => void;
}) {
  const openAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status !== "COMPLETED" && appointment.status !== "CANCELLED"),
    [appointments]
  );
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(openAppointments[0]?.id ?? "");
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackToastState>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedAppointmentId && openAppointments[0]) {
      setSelectedAppointmentId(openAppointments[0].id);
    }
  }, [openAppointments, selectedAppointmentId]);

  function showFeedback(nextFeedback: FeedbackToastState) {
    setFeedback(nextFeedback);
    window.setTimeout(() => setFeedback(null), 3600);
  }

  function saveConsultation(formData: FormData) {
    const appointmentId = String(formData.get("appointmentId") ?? selectedAppointmentId);
    if (!appointmentId) {
      showFeedback({ type: "error", message: "Select an appointment before saving consultation." });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/consultations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId,
            diagnosis: formData.get("diagnosis"),
            notes: formData.get("notes"),
            medicines: formData.get("medicines"),
            followUpAt: formData.get("followUpAt")
          })
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to save consultation");
        }

        setSaved(true);
        showFeedback({ type: "success", message: "Consultation and prescription saved." });
        onSaved?.();
        window.dispatchEvent(new CustomEvent("meditrack:data-refresh"));
      } catch (error) {
        showFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Unable to save consultation."
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
            Doctor workflow
          </p>
          <h3 className="mt-2 text-2xl font-bold">Consultation form</h3>
        </div>
        <ClipboardPlus className="size-8 text-primary" />
      </div>

      <form action={saveConsultation} className="grid gap-4">
        <select
          name="appointmentId"
          value={selectedAppointmentId}
          onChange={(event) => setSelectedAppointmentId(event.target.value)}
          className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select appointment</option>
          {openAppointments.map((appointment) => (
            <option key={appointment.id} value={appointment.id}>
              {appointment.patient.name} - {appointment.slot.time} - {appointment.reason}
            </option>
          ))}
        </select>
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
        <Button className="rounded-md" disabled={isPending || openAppointments.length === 0}>
          <Save className="mr-2 size-4" />
          {isPending ? "Saving to lifetime history..." : "Save to patient history"}
        </Button>
      </form>

      {openAppointments.length === 0 && (
        <p className="mt-4 rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
          No open appointments are available for consultation notes.
        </p>
      )}

      {saved && (
        <Badge className="mt-4 text-emerald-300">
          Saved and linked to the patient timeline
        </Badge>
      )}
    </Card>
  );
}
