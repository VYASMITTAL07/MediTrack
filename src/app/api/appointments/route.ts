import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { formatAppointment } from "@/lib/healthcare";
import { prisma } from "@/lib/prisma";
import { findUserForSession } from "@/lib/session";

const appointmentSchema = z.object({
  doctorId: z.string().min(1).optional(),
  slotId: z.string().min(1),
  reason: z.string().min(1).max(500)
});

const updateSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED"])
});

const reservingStatuses = new Set(["HOLD", "CONFIRMED", "RESCHEDULED"]);

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const user = await findUserForSession(session);

  if (!session || !user || session.role !== "PATIENT" || !user.patientProfile) {
    return NextResponse.json({ error: "Patient login required to book appointments" }, { status: 401 });
  }

  const parsed = appointmentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid appointment payload" }, { status: 400 });
  }

  try {
    const patientId = user.patientProfile.id;
    const appointment = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: parsed.data.slotId },
        include: { doctor: { include: { user: true, clinic: true } } }
      });

      if (!slot || slot.isBlocked) {
        throw new Error("SLOT_UNAVAILABLE");
      }

      if (parsed.data.doctorId && parsed.data.doctorId !== slot.doctorId) {
        throw new Error("DOCTOR_SLOT_MISMATCH");
      }

      const existingBooking = await tx.appointment.findUnique({
        where: {
          slotId_patientId: {
            slotId: slot.id,
            patientId
          }
        }
      });

      if (existingBooking) {
        throw new Error("DUPLICATE_BOOKING");
      }

      const updated = await tx.slot.updateMany({
        where: {
          id: slot.id,
          isBlocked: false,
          bookedCount: { lt: slot.capacity }
        },
        data: {
          bookedCount: { increment: 1 }
        }
      });

      if (updated.count !== 1) {
        throw new Error("SLOT_UNAVAILABLE");
      }

      const queueNumber =
        (await tx.appointment.count({
          where: { doctorId: slot.doctorId, slotId: slot.id }
        })) + 1;

      const created = await tx.appointment.create({
        data: {
          patientId,
          doctorId: slot.doctorId,
          slotId: slot.id,
          reason: parsed.data.reason,
          queueNumber
        },
        include: {
          doctor: { include: { user: true, clinic: true } },
          patient: { include: { user: true } },
          slot: true
        }
      });

      await tx.notification.createMany({
        data: [
          {
            userId: user.id,
            channel: "IN_APP",
            title: "Appointment booked",
            body: `Your appointment with ${created.doctor.user.name} is confirmed for ${created.slot.startsAt.toLocaleString("en-IN")}.`
          },
          {
            userId: created.doctor.userId,
            channel: "IN_APP",
            title: "New appointment booked",
            body: `${user.name} booked a consultation for ${created.slot.startsAt.toLocaleString("en-IN")}.`
          }
        ]
      });

      return created;
    });

    return NextResponse.json({ appointment: formatAppointment(appointment), source: "database" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "BOOKING_FAILED";
    if (message === "SLOT_UNAVAILABLE") {
      return NextResponse.json({ error: "Slot is no longer available" }, { status: 409 });
    }
    if (message === "DOCTOR_SLOT_MISMATCH") {
      return NextResponse.json({ error: "Selected doctor does not own this slot" }, { status: 400 });
    }
    if (message === "DUPLICATE_BOOKING") {
      return NextResponse.json({ error: "You already have an appointment for this slot" }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "You already have an appointment for this slot" }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to book appointment" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const user = await findUserForSession(session);

  if (!session || !user) {
    return NextResponse.json({ appointments: [] }, { status: 401 });
  }

  const appointments = await prisma.appointment.findMany({
    where:
      session.role === "DOCTOR" && user.doctorProfile
        ? { doctorId: user.doctorProfile.id }
        : session.role === "PATIENT" && user.patientProfile
          ? { patientId: user.patientProfile.id }
          : {},
    include: {
      doctor: { include: { user: true, clinic: true } },
      patient: { include: { user: true } },
      slot: true
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return NextResponse.json({ appointments: appointments.map(formatAppointment), source: "database" });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const user = await findUserForSession(session);

  if (!session || !user || session.role !== "DOCTOR" || !user.doctorProfile) {
    return NextResponse.json({ error: "Doctor session required" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid appointment update" }, { status: 400 });
  }

  const doctorId = user.doctorProfile.id;
  const ownedAppointment = await prisma.appointment.findFirst({
    where: {
      id: parsed.data.appointmentId,
      doctorId
    },
    include: { slot: true }
  });

  if (!ownedAppointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      if (
        parsed.data.status === "CANCELLED" &&
        reservingStatuses.has(ownedAppointment.status)
      ) {
        await tx.slot.updateMany({
          where: { id: ownedAppointment.slotId, bookedCount: { gt: 0 } },
          data: { bookedCount: { decrement: 1 } }
        });
      }

      if (
        ownedAppointment.status === "CANCELLED" &&
        reservingStatuses.has(parsed.data.status)
      ) {
        const reserved = await tx.slot.updateMany({
          where: {
            id: ownedAppointment.slotId,
            isBlocked: false,
            bookedCount: { lt: ownedAppointment.slot.capacity }
          },
          data: { bookedCount: { increment: 1 } }
        });

        if (reserved.count !== 1) {
          throw new Error("SLOT_UNAVAILABLE");
        }
      }

      return tx.appointment.update({
        where: { id: ownedAppointment.id },
        data: { status: parsed.data.status },
        include: {
          doctor: { include: { user: true, clinic: true } },
          patient: { include: { user: true } },
          slot: true
        }
      });
    });

    await prisma.notification.create({
      data: {
        userId: appointment.patient.userId,
        channel: "IN_APP",
        title: "Appointment updated",
        body: `Your appointment with ${appointment.doctor.user.name} is now ${appointment.status.toLowerCase()}.`
      }
    });

    return NextResponse.json({ appointment: formatAppointment(appointment) });
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_UNAVAILABLE") {
      return NextResponse.json({ error: "Slot is no longer available" }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to update appointment" }, { status: 500 });
  }
}
