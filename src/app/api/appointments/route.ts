import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const appointmentSchema = z.object({
  patientId: z.string().optional(),
  doctorId: z.string().min(1),
  slotId: z.string().min(1),
  date: z.string().optional(),
  reason: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const parsed = appointmentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid appointment payload" }, { status: 400 });
  }

  if (parsed.data.slotId.startsWith("slot-") || parsed.data.doctorId.startsWith("dr-")) {
    return NextResponse.json({
      appointment: {
        id: `demo-${parsed.data.slotId}`,
        ...parsed.data,
        status: "CONFIRMED",
        queueNumber: Math.floor(Math.random() * 12) + 1
      },
      source: "demo"
    });
  }

  const session = await getSessionFromRequest(request);
  const patient = parsed.data.patientId
    ? { id: parsed.data.patientId }
    : session
      ? await prisma.patientProfile.findUnique({ where: { userId: session.userId } })
      : null;

  if (!patient) {
    return NextResponse.json({ error: "Patient profile required" }, { status: 401 });
  }

  const appointment = await prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({
      where: { id: parsed.data.slotId }
    });

    if (!slot || slot.isBlocked || slot.bookedCount >= slot.capacity) {
      throw new Error("Slot unavailable");
    }

    await tx.slot.update({
      where: { id: slot.id },
      data: { bookedCount: { increment: 1 } }
    });

    return tx.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: parsed.data.doctorId,
        slotId: slot.id,
        reason: parsed.data.reason,
        queueNumber: Math.floor(Math.random() * 12) + 1
      }
    });
  });

  return NextResponse.json({ appointment, source: "database" });
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ appointments: [], source: "anonymous" });

  const appointments = await prisma.appointment
    .findMany({
      where:
        session.role === "DOCTOR"
          ? { doctor: { userId: session.userId } }
          : { patient: { userId: session.userId } },
      include: {
        doctor: { include: { user: true, clinic: true } },
        patient: { include: { user: true } },
        slot: true
      },
      orderBy: { createdAt: "desc" },
      take: 25
    })
    .catch(() => []);

  return NextResponse.json({ appointments, source: "database" });
}
