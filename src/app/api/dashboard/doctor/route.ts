import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  dayRange,
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

  if (!session || !user || session.role !== "DOCTOR" || !user.doctorProfile) {
    return NextResponse.json({ error: "Doctor session required" }, { status: 401 });
  }

  const doctorId = user.doctorProfile.id;
  const { startsAt, endsAt } = dayRange();

  const [appointments, todayCount, completedCount, liveSlots, notifications] = await Promise.all([
    prisma.appointment.findMany({
      where: { doctorId },
      include: {
        doctor: { include: { user: true, clinic: true } },
        patient: { include: { user: true } },
        slot: true
      },
      orderBy: [{ slot: { startsAt: "asc" } }, { createdAt: "desc" }],
      take: 30
    }),
    prisma.appointment.count({
      where: {
        doctorId,
        slot: {
          startsAt: {
            gte: startsAt,
            lt: endsAt
          }
        }
      }
    }),
    prisma.appointment.count({
      where: { doctorId, status: "COMPLETED" }
    }),
    prisma.slot.count({
      where: {
        doctorId,
        isBlocked: false,
        startsAt: { gte: startsAt }
      }
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  const patientIds = [...new Set(appointments.map((appointment) => appointment.patientId))];

  const [records, reports, prescriptions] = await Promise.all([
    prisma.medicalRecord.findMany({
      where: { patientId: { in: patientIds } },
      orderBy: { occurredAt: "desc" },
      take: 30
    }),
    prisma.report.findMany({
      where: { patientId: { in: patientIds } },
      orderBy: { uploadedAt: "desc" },
      take: 30
    }),
    prisma.prescription.findMany({
      where: { doctorId },
      include: { doctor: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 30
    })
  ]);

  return NextResponse.json({
    doctor: {
      id: doctorId,
      name: user.name,
      specialization: user.doctorProfile.specialization
    },
    stats: {
      todayAppointments: todayCount,
      consultsCompleted: completedCount,
      reportsPending: reports.filter((report) => report.verificationStatus === "PENDING").length,
      liveSlots
    },
    appointments: appointments.map(formatAppointment),
    medicalRecords: records.map(formatMedicalRecord),
    reports: reports.map(formatReport),
    prescriptions: prescriptions.map(formatPrescription),
    notifications: notifications.map(formatNotification)
  });
}
