import type {
  Appointment,
  DoctorProfile,
  MedicalRecord,
  Notification,
  PatientProfile,
  Prescription,
  Report,
  Slot,
  User
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function dayRange(date?: string | null) {
  const source = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);
  const startsAt = new Date(`${source}T00:00:00`);
  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + 1);
  return { date: source, startsAt, endsAt };
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

export function formatDoctor(
  doctor: DoctorProfile & {
    user: User;
    clinic?: { name: string | null } | null;
  }
) {
  return {
    id: doctor.id,
    name: doctor.user.name,
    specialty: doctor.specialization,
    rating: doctor.rating,
    reviews: doctor.reviewCount,
    distance: "Nearby",
    experience: doctor.experienceYears,
    fee: doctor.consultationFee,
    availability: doctor.isEmergencyReady ? "Live now" : "Available",
    nextSlot: "Check slots",
    emergency: doctor.isEmergencyReady,
    image: doctor.user.avatarUrl ?? "/images/hospital-room.webp",
    clinic: doctor.clinic?.name ?? "MediTrack Clinic",
    verified: doctor.verificationStatus === "VERIFIED"
  };
}

export function formatSlot(slot: Slot) {
  return {
    id: slot.id,
    doctorId: slot.doctorId,
    time: formatTime(slot.startsAt),
    startsAt: slot.startsAt.toISOString(),
    endsAt: slot.endsAt.toISOString(),
    capacity: slot.capacity,
    bookedCount: slot.bookedCount,
    available: !slot.isBlocked && slot.bookedCount < slot.capacity
  };
}

export function formatAppointment(
  appointment: Appointment & {
    doctor: DoctorProfile & { user: User; clinic?: { name: string | null } | null };
    patient: PatientProfile & { user: User };
    slot: Slot;
  }
) {
  return {
    id: appointment.id,
    reason: appointment.reason,
    status: appointment.status,
    queueNumber: appointment.queueNumber,
    urgencyLevel: appointment.urgencyLevel,
    riskScore: appointment.riskScore,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
    doctor: formatDoctor(appointment.doctor),
    patient: {
      id: appointment.patient.id,
      userId: appointment.patient.userId,
      name: appointment.patient.user.name,
      healthScore: appointment.patient.healthScore,
      allergies: appointment.patient.allergies
    },
    slot: formatSlot(appointment.slot)
  };
}

export function formatMedicalRecord(record: MedicalRecord) {
  return {
    id: record.id,
    date: record.occurredAt.toISOString(),
    title: record.title,
    type: record.type.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase()),
    summary: record.summary,
    verified: record.verified,
    aiSummary: record.aiSummary ?? "Saved to the patient record."
  };
}

export function formatPrescription(prescription: Prescription & { doctor?: DoctorProfile & { user: User } }) {
  return {
    id: prescription.id,
    diagnosis: prescription.diagnosis,
    medicines: prescription.medicines,
    instructions: prescription.instructions,
    followUpAt: prescription.followUpAt?.toISOString() ?? null,
    createdAt: prescription.createdAt.toISOString(),
    doctorName: prescription.doctor?.user.name ?? "Doctor"
  };
}

export function formatReport(report: Report) {
  return {
    id: report.id,
    title: report.title,
    fileUrl: report.fileUrl,
    fileType: report.fileType,
    verificationStatus: report.verificationStatus,
    aiConfidence: report.aiConfidence,
    flags: report.flags,
    summary: report.ocrText?.split("AI summary: ").at(1) ?? null,
    uploadedAt: report.uploadedAt.toISOString()
  };
}

export function formatNotification(notification: Notification) {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    channel: notification.channel,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString()
  };
}

export async function ensureSlotsForDoctorDate(doctorId: string, date?: string | null) {
  const { startsAt, endsAt } = dayRange(date);
  const existing = await prisma.slot.findMany({
    where: {
      doctorId,
      startsAt: {
        gte: startsAt,
        lt: endsAt
      }
    },
    orderBy: { startsAt: "asc" }
  });

  if (existing.length > 0) return existing;

  const slotHours = [
    [9, 0],
    [10, 30],
    [12, 0],
    [14, 0],
    [16, 30],
    [18, 0]
  ];

  await prisma.slot.createMany({
    skipDuplicates: true,
    data: slotHours.map(([hour, minute]) => {
      const slotStart = new Date(startsAt);
      slotStart.setHours(hour, minute, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + 30);
      return {
        doctorId,
        startsAt: slotStart,
        endsAt: slotEnd
      };
    })
  });

  return prisma.slot.findMany({
    where: {
      doctorId,
      startsAt: {
        gte: startsAt,
        lt: endsAt
      }
    },
    orderBy: { startsAt: "asc" }
  });
}

export async function resolveDoctor(doctorId?: string | null) {
  if (doctorId) {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { user: true, clinic: true }
    });
    if (doctor) return doctor;
  }

  return prisma.doctorProfile.findFirst({
    include: { user: true, clinic: true },
    orderBy: [{ verificationStatus: "asc" }, { rating: "desc" }]
  });
}
