import { NextResponse, type NextRequest } from "next/server";
import { ensureSlotsForDoctorDate, formatDoctor, formatSlot, resolveDoctor } from "@/lib/healthcare";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");

  const doctor = await resolveDoctor(doctorId);

  if (!doctor) {
    return NextResponse.json({ slots: [], doctor: null, source: "database-empty" });
  }

  const slots = await ensureSlotsForDoctorDate(doctor.id, date);

  return NextResponse.json({
    doctor: formatDoctor(doctor),
    slots: slots.map(formatSlot),
    source: "database"
  });
}
