import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { Role, VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { signSession, isStrongPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readPayload, requestOrigin } from "@/lib/request";
import { verifyRememberedPin } from "@/lib/pin";

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
  const pin = parsed.data.pin ?? parsed.data.otp ?? "";

  if (!/^\d{6}$/.test(pin) || !verifyRememberedPin(email, "ACCOUNT_VERIFICATION", pin)) {
    return NextResponse.json({ error: "Invalid or expired account creation PIN" }, { status: 401 });
  }

  if (parsed.data.identityMethod === "AADHAAR" && !parsed.data.aadhaarLast4) {
    return NextResponse.json({ error: "Aadhaar last 4 digits are required" }, { status: 400 });
  }

  if (parsed.data.identityMethod === "FACE" && parsed.data.faceConsent !== "yes") {
    return NextResponse.json({ error: "Face scan consent is required" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const otpHash = await bcrypt.hash(pin, 10);

  const user = await prisma
    .$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: parsed.data.name,
          email,
          phone: parsed.data.phone || null,
          passwordHash,
          role: parsed.data.role as Role,
          verificationStatus:
            parsed.data.role === "ADMIN" ? VerificationStatus.PENDING : VerificationStatus.VERIFIED,
          otps: {
            create: {
              codeHash: otpHash,
              purpose: "ACCOUNT_VERIFICATION",
              expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            }
          }
        }
      });

      if (parsed.data.role === "PATIENT") {
        await tx.patientProfile.create({
          data: {
            userId: created.id,
            allergies: [],
            aadhaarHash:
              parsed.data.identityMethod === "AADHAAR"
                ? `aadhaar_last4_${parsed.data.aadhaarLast4}`
                : undefined,
            faceVectorHash:
              parsed.data.identityMethod === "FACE" ? `face_scan_${created.id}` : undefined,
            qrCode: `MEDITRACK-${created.id.slice(-8).toUpperCase()}`
          }
        });
      }

      if (parsed.data.role === "DOCTOR") {
        await tx.doctorProfile.create({
          data: {
            userId: created.id,
            licenseNumber: parsed.data.licenseNumber || `PENDING-${created.id}`,
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

      return created;
    })
    .catch(() => ({
      id: `demo-${parsed.data.role.toLowerCase()}-${Date.now()}`,
      email,
      role: parsed.data.role as Role,
      verificationStatus:
        parsed.data.role === "ADMIN" ? VerificationStatus.PENDING : VerificationStatus.VERIFIED
    }));

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
    response.cookies.set("meditrack_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    response.cookies.set("meditrack_dev_pin", pin, {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10
    });
    return response;
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus
    },
    token,
    devPin: process.env.NODE_ENV === "production" ? undefined : pin,
    devOtp: process.env.NODE_ENV === "production" ? undefined : pin
  });
}
