import { NextResponse, type NextRequest } from "next/server";
import { appointmentSlots } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");

  if (!doctorId || doctorId.startsWith("dr-")) {
    return NextResponse.json({ slots: appointmentSlots, source: "demo" });
  }

  const startsAt = date ? new Date(date) : new Date();
  startsAt.setHours(0, 0, 0, 0);
  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + 1);

  const slots = await prisma.slot
    .findMany({
      where: {
        doctorId,
        startsAt: {
          gte: startsAt,
          lt: endsAt
        }
      },
      orderBy: { startsAt: "asc" }
    })
    .catch(() => []);

  return NextResponse.json({
    slots: slots.map((slot) => ({
      id: slot.id,
      time: slot.startsAt.toISOString().slice(11, 16),
      available: !slot.isBlocked && slot.bookedCount < slot.capacity
    })),
    source: slots.length ? "database" : "database-empty"
  });
}
