import { PrismaClient, Role, VerificationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("MediTrack@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@meditrack.ai" },
    update: {},
    create: {
      name: "MediTrack Command",
      email: "admin@meditrack.ai",
      passwordHash,
      role: Role.ADMIN,
      verificationStatus: VerificationStatus.VERIFIED,
      emailVerifiedAt: new Date()
    }
  });

  const clinic = await prisma.clinic.upsert({
    where: { id: "clinic-meditrack-mumbai" },
    update: {},
    create: {
      id: "clinic-meditrack-mumbai",
      name: "MediTrack Precision Clinic",
      address: "Bandra Kurla Complex, Mumbai",
      city: "Mumbai",
      state: "Maharashtra",
      latitude: 19.0691,
      longitude: 72.8657,
      phone: "+91-90000-11111",
      imageUrl:
        "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1200&q=80",
      emergencyAvailable: true,
      verificationStatus: VerificationStatus.VERIFIED,
      timings: {
        weekdays: "08:00-21:00",
        weekend: "09:00-16:00"
      }
    }
  });

  const doctorUser = await prisma.user.upsert({
    where: { email: "doctor@meditrack.ai" },
    update: {},
    create: {
      name: "Dr. Ira Mehta",
      email: "doctor@meditrack.ai",
      phone: "+919800000001",
      passwordHash,
      role: Role.DOCTOR,
      avatarUrl:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80",
      verificationStatus: VerificationStatus.VERIFIED,
      emailVerifiedAt: new Date()
    }
  });

  const doctor = await prisma.doctorProfile.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      clinicId: clinic.id,
      licenseNumber: "MCI-AI-2048",
      specialization: "Cardiology",
      experienceYears: 14,
      consultationFee: 1800,
      bio: "AI-assisted preventive cardiology specialist focused on early risk detection.",
      education: ["MBBS", "MD Cardiology", "FACC"],
      languages: ["English", "Hindi", "Marathi"],
      rating: 4.94,
      reviewCount: 428,
      isEmergencyReady: true,
      verificationStatus: VerificationStatus.VERIFIED
    }
  });

  const patientUser = await prisma.user.upsert({
    where: { email: "patient@meditrack.ai" },
    update: {},
    create: {
      name: "Aarav Sharma",
      email: "patient@meditrack.ai",
      phone: "+919800000002",
      passwordHash,
      role: Role.PATIENT,
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
      verificationStatus: VerificationStatus.VERIFIED,
      emailVerifiedAt: new Date()
    }
  });

  const patient = await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      dateOfBirth: new Date("1998-05-12"),
      bloodGroup: "B+",
      allergies: ["Penicillin"],
      aadhaarHash: "hash_demo_aadhaar",
      faceVectorHash: "hash_demo_face",
      healthScore: 84,
      qrCode: "MEDITRACK-AARAV-0001",
      emergencyContact: {
        name: "Neha Sharma",
        phone: "+919800000099",
        relation: "Sister"
      },
      insurance: {
        provider: "Aegis Health",
        policy: "AH-2248-90",
        validTill: "2028-03-31"
      }
    }
  });

  const base = new Date();
  base.setHours(9, 0, 0, 0);
  for (let day = 1; day <= 7; day += 1) {
    for (let hour = 9; hour <= 17; hour += 2) {
      const startsAt = new Date(base);
      startsAt.setDate(base.getDate() + day);
      startsAt.setHours(hour, 0, 0, 0);
      const endsAt = new Date(startsAt);
      endsAt.setMinutes(endsAt.getMinutes() + 30);
      await prisma.slot.upsert({
        where: {
          doctorId_startsAt: {
            doctorId: doctor.id,
            startsAt
          }
        },
        update: {},
        create: {
          doctorId: doctor.id,
          startsAt,
          endsAt
        }
      });
    }
  }

  await prisma.medicalRecord.createMany({
    skipDuplicates: true,
    data: [
      {
        patientId: patient.id,
        doctorId: doctor.id,
        type: "VACCINATION",
        title: "Childhood immunization set",
        summary: "Completed DTP, MMR, Hepatitis B, and Polio vaccination schedule.",
        occurredAt: new Date("2003-01-09"),
        aiSummary: "Foundational immunity records complete and verified.",
        verified: true
      },
      {
        patientId: patient.id,
        doctorId: doctor.id,
        type: "LAB_REPORT",
        title: "Annual blood panel",
        summary: "Vitamin D mildly low. Lipid markers normal.",
        occurredAt: new Date("2025-08-11"),
        aiSummary: "Low-risk report. Recommend sunlight exposure and follow-up vitamin D check.",
        verified: true
      },
      {
        patientId: patient.id,
        doctorId: doctor.id,
        type: "CONSULTATION",
        title: "Cardiology preventive consult",
        summary: "Occasional palpitations under stress. ECG normal.",
        occurredAt: new Date("2026-01-24"),
        aiSummary: "Stress-linked symptoms with no acute abnormality; monitor if frequency rises.",
        verified: true
      }
    ]
  });

  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: patientUser.id,
        channel: "IN_APP",
        title: "AI health score updated",
        body: "Your preventive score increased to 84 after your latest verified lab report."
      },
      {
        userId: admin.id,
        channel: "IN_APP",
        title: "Doctor verification queue clear",
        body: "All active doctor profiles have verified license metadata."
      }
    ]
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
