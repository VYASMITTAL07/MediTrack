import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { Prisma, Role, VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { isStrongPassword, setSessionCookie, signSession } from "@/lib/auth";
import { verifyAndConsumeOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { readPayload, requestOrigin } from "@/lib/request";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]).default("PATIENT"),
  identityMethod: z.enum(["AADHAAR", "FACE"]).default("AADHAAR"),
  aadhaarLast4: z.string().regex(/^\d{4}$/).optional(),
  faceConsent: z.string().optional(),
  pin: z.string().length(6).optional(),
  otp: z.string().length(6).optional(),
  licenseNumber: z.string().optional()
});

export async function POST(request: NextRequest) {
  const { data, source } = await readPayload(request);
  const parsed = registerSchema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration payload" }, { status: 400 });
  }

  if (!isStrongPassword(parsed.data.password)) {
    return NextResponse.json(
      { error: "Password must include uppercase, lowercase, number, and 8+ characters." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const otpCode = parsed.data.otp ?? parsed.data.pin ?? "";

  if (!/^\d{6}$/.test(otpCode)) {
    return NextResponse.json({ error: "Valid 6-digit email OTP is required" }, { status: 400 });
  }

  if (parsed.data.identityMethod === "AADHAAR" && !parsed.data.aadhaarLast4) {
    return NextResponse.json({ error: "Aadhaar last 4 digits are required" }, { status: 400 });
  }

  if (parsed.data.identityMethod === "FACE" && parsed.data.faceConsent !== "yes") {
    return NextResponse.json({ error: "Face scan consent is required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: {
      patientProfile: true,
      doctorProfile: true
    }
  });

  if (!existing) {
    return NextResponse.json({ error: "Request an email OTP before creating the account." }, { status: 401 });
  }

  if (existing.role !== parsed.data.role) {
    return NextResponse.json({ error: "Request a fresh email OTP for this portal role." }, { status: 403 });
  }

  if (existing.emailVerifiedAt || existing.patientProfile || existing.doctorProfile) {
    return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const otpValid = await verifyAndConsumeOtp({
        tx,
        userId: existing.id,
        purpose: "ACCOUNT_VERIFICATION",
        code: otpCode
      });

      if (!otpValid) {
        throw new Error("INVALID_OTP");
      }

      const updated = await tx.user.update({
        where: { id: existing.id },
        data: {
          name: parsed.data.name,
          phone: parsed.data.phone || null,
          passwordHash,
          role: parsed.data.role as Role,
          verificationStatus:
            parsed.data.role === "ADMIN" ? VerificationStatus.PENDING : VerificationStatus.VERIFIED,
          emailVerifiedAt: new Date()
        }
      });

      if (parsed.data.role === "PATIENT") {
        await tx.patientProfile.create({
          data: {
            userId: updated.id,
            allergies: [],
            aadhaarHash:
              parsed.data.identityMethod === "AADHAAR"
                ? `aadhaar_last4_${parsed.data.aadhaarLast4}`
                : undefined,
            faceVectorHash:
              parsed.data.identityMethod === "FACE" ? `face_scan_${updated.id}` : undefined,
            qrCode: `MEDITRACK-${updated.id.slice(-8).toUpperCase()}`
          }
        });
      }

      if (parsed.data.role === "DOCTOR") {
        await tx.doctorProfile.create({
          data: {
            userId: updated.id,
            licenseNumber: parsed.data.licenseNumber || `PENDING-${updated.id}`,
            specialization: "General Medicine",
            experienceYears: 0,
            consultationFee: 0,
            bio: "Verification pending.",
            education: [],
            languages: ["English"],
            verificationStatus: VerificationStatus.PENDING
          }
        });
      }

      return updated;
    });

    const token = await signSession({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const destination =
      user.role === "DOCTOR" ? "/doctor" : user.role === "ADMIN" ? "/admin" : "/patient";

    if (source === "form") {
      const response = NextResponse.redirect(new URL(`${destination}?registered=1`, requestOrigin(request)), {
        status: 303
      });
      setSessionCookie(response, token);
      return response;
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus
      },
      token
    });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_OTP") {
      return NextResponse.json({ error: "Invalid or expired email OTP" }, { status: 401 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email, phone, license, or QR code already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
