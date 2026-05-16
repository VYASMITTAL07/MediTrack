import { NextResponse } from "next/server";
import { formatDoctor } from "@/lib/healthcare";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dbDoctors = await prisma.doctorProfile.findMany({
    include: {
      user: true,
      clinic: true
    },
    orderBy: [{ rating: "desc" }, { experienceYears: "desc" }],
    take: 24
  });

  const nextSlots = await prisma.slot.findMany({
    where: {
      doctorId: { in: dbDoctors.map((doctor) => doctor.id) },
      isBlocked: false,
      startsAt: { gte: new Date() }
    },
    orderBy: { startsAt: "asc" }
  });

  return NextResponse.json({
    doctors: dbDoctors.map((doctor) => {
      const nextSlot = nextSlots.find((slot) => slot.doctorId === doctor.id);
      return {
        ...formatDoctor(doctor),
        nextSlot: nextSlot
          ? nextSlot.startsAt.toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short"
            })
          : "No slots"
      };
    }),
    source: "database"
  });
}
