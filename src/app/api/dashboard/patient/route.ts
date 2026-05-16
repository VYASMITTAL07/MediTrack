import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  formatAppointment,
  formatMedicalRecord,
  formatNotification,
  formatPrescription,
  formatReport
} from "@/lib/healthcare";
import { prisma } from "@/lib/prisma";
import { findUserForSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const user = await findUserForSession(session);

  if (!session || !user || session.role !== "PATIENT" || !user.patientProfile) {
    return NextResponse.json({ error: "Patient session required" }, { status: 401 });
  }

  const patientId = user.patientProfile.id;
  const now = new Date();

  const [
    appointments,
    medicalRecords,
    prescriptions,
    reports,
    notifications,
    upcomingVisits,
    unreadNotifications,
    verifiedRecordCount
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: { include: { user: true, clinic: true } },
        patient: { include: { user: true } },
        slot: true
      },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { occurredAt: "desc" },
      take: 20
    }),
    prisma.prescription.findMany({
      where: { patientId },
      include: { doctor: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.report.findMany({
      where: { patientId },
      orderBy: { uploadedAt: "desc" },
      take: 20
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.appointment.count({
      where: {
        patientId,
        status: { in: ["CONFIRMED", "HOLD", "RESCHEDULED"] },
        slot: { startsAt: { gte: now } }
      }
    }),
    prisma.notification.count({
      where: { userId: user.id, readAt: null }
    }),
    prisma.medicalRecord.count({
      where: { patientId, verified: true }
    })
  ]);

  return NextResponse.json({
    patient: {
      id: user.patientProfile.id,
      name: user.name,
      healthScore: user.patientProfile.healthScore,
      bloodGroup: user.patientProfile.bloodGroup,
      allergies: user.patientProfile.allergies
    },
    stats: {
      healthScore: user.patientProfile.healthScore,
      verifiedRecords: verifiedRecordCount + reports.filter((report) => report.verificationStatus === "VERIFIED").length,
      upcomingVisits,
      notifications: unreadNotifications
    },
    appointments: appointments.map(formatAppointment),
    medicalRecords: medicalRecords.map(formatMedicalRecord),
    prescriptions: prescriptions.map(formatPrescription),
    reports: reports.map(formatReport),
    notifications: notifications.map(formatNotification)
  });
}
