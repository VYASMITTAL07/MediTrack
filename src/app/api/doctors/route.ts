import { NextResponse } from "next/server";
import { doctors } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dbDoctors = await prisma.doctorProfile
    .findMany({
      include: {
        user: true,
        clinic: true
      },
      orderBy: [{ rating: "desc" }, { experienceYears: "desc" }],
      take: 24
    })
    .catch(() => []);

  if (dbDoctors.length === 0) {
    return NextResponse.json({ doctors, source: "demo" });
  }

  return NextResponse.json({
    doctors: dbDoctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.user.name,
      specialty: doctor.specialization,
      rating: doctor.rating,
      reviews: doctor.reviewCount,
      experience: doctor.experienceYears,
      fee: doctor.consultationFee,
      emergency: doctor.isEmergencyReady,
      image: doctor.user.avatarUrl,
      clinic: doctor.clinic?.name,
      verified: doctor.verificationStatus === "VERIFIED"
    })),
    source: "database"
  });
}
