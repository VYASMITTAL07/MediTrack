import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { formatMedicalRecord, formatPrescription } from "@/lib/healthcare";
import { prisma } from "@/lib/prisma";
import { findUserForSession } from "@/lib/session";

const consultationSchema = z.object({
  appointmentId: z.string().min(1),
  diagnosis: z.string().min(1),
  medicines: z.string().min(1),
  notes: z.string().min(1),
  followUpAt: z.string().optional()
});

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const user = await findUserForSession(session);

  if (!session || !user || session.role !== "DOCTOR" || !user.doctorProfile) {
    return NextResponse.json({ error: "Doctor session required" }, { status: 401 });
  }

  const parsed = consultationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid consultation payload" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: parsed.data.appointmentId,
      doctorId: user.doctorProfile.id
    },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
      slot: true
    }
  });

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found for this doctor" }, { status: 404 });
  }

  const followUpAt = parsed.data.followUpAt ? new Date(parsed.data.followUpAt) : null;

  const result = await prisma.$transaction(async (tx) => {
    const record = await tx.medicalRecord.create({
      data: {
        patientId: appointment.patientId,
        doctorId: user.doctorProfile!.id,
        type: "CONSULTATION",
        title: parsed.data.diagnosis,
        summary: parsed.data.notes,
        occurredAt: new Date(),
        verified: true,
        aiSummary: "Doctor consultation saved to the longitudinal patient record.",
        metadata: {
          appointmentId: appointment.id,
          medicines: parsed.data.medicines,
          followUpAt: followUpAt?.toISOString() ?? null
        }
      }
    });

    const prescription = await tx.prescription.create({
      data: {
        patientId: appointment.patientId,
        doctorId: user.doctorProfile!.id,
        diagnosis: parsed.data.diagnosis,
        medicines: {
          text: parsed.data.medicines,
          lines: parsed.data.medicines
            .split(/\r?\n|,/)
            .map((item) => item.trim())
            .filter(Boolean)
        },
        instructions: parsed.data.notes,
        followUpAt
      },
      include: { doctor: { include: { user: true } } }
    });

    const updatedAppointment = await tx.appointment.update({
      where: { id: appointment.id },
      data: { status: "COMPLETED" }
    });

    await tx.notification.createMany({
      data: [
        {
          userId: appointment.patient.userId,
          channel: "IN_APP",
          title: "Consultation completed",
          body: `${appointment.doctor.user.name} added consultation notes and prescription for ${parsed.data.diagnosis}.`
        },
        {
          userId: user.id,
          channel: "IN_APP",
          title: "Consultation saved",
          body: `Consultation for ${appointment.patient.user.name} was saved to the patient timeline.`
        }
      ]
    });

    return { record, prescription, appointment: updatedAppointment };
  });

  return NextResponse.json({
    record: formatMedicalRecord(result.record),
    prescription: formatPrescription(result.prescription),
    appointment: result.appointment
  });
}
