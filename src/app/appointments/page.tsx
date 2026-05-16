import { AppointmentBoard } from "@/components/dashboard/appointment-board";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DoctorFinder } from "@/components/dashboard/doctor-finder";
import { NearbyMap } from "@/components/dashboard/nearby-map";

export default function AppointmentsPage() {
  return (
      <DashboardShell
        eyebrow="Appointment booking"
      title="Book a doctor appointment."
      description="Choose a specialist, select a date, hold a slot, and confirm it with live availability."
    >
      <div className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <AppointmentBoard />
        <DoctorFinder />
      </div>
      <div className="mt-6">
        <NearbyMap />
      </div>
    </DashboardShell>
  );
}
