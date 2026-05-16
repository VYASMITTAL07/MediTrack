import { AIChatPanel } from "@/components/dashboard/ai-chat-panel";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DiseaseAnalysis } from "@/components/dashboard/disease-analysis";
import { DoctorFinder } from "@/components/dashboard/doctor-finder";
import { MedicalTimeline } from "@/components/dashboard/medical-timeline";
import { ReportVerification } from "@/components/dashboard/report-verification";

export default function AIConsultPage() {
  return (
      <DashboardShell
        eyebrow="AI consultation"
      title="Ask about symptoms and records."
      description="Use the assistant for summaries and next steps, then book a clinician when symptoms need review."
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <AIChatPanel />
        <DiseaseAnalysis />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <ReportVerification />
        <MedicalTimeline />
      </div>
      <div className="mt-6">
        <DoctorFinder />
      </div>
    </DashboardShell>
  );
}
