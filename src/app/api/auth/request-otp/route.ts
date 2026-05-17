import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { Role, VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { sendOtpEmail } from "@/lib/email";
import { canReturnDevOtp, generateOtp, otpExpiresInMinutes, otpExpiry } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

const requestOtpSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["SIGN_IN", "ACCOUNT_VERIFICATION"]).default("SIGN_IN"),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]).default("PATIENT")
});

export async function POST(request: NextRequest) {
  const parsed = requestOtpSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid OTP request" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const purpose = parsed.data.purpose;
  const role = parsed.data.role as Role;
  const code = generateOtp();
  let otpId: string | null = null;

  try {
    const user = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email },
        include: {
          patientProfile: true,
          doctorProfile: true
        }
      });

      if (purpose === "SIGN_IN") {
        if (!existing) return null;
        return existing;
      }

      if (existing?.emailVerifiedAt || existing?.patientProfile || existing?.doctorProfile) {
        throw new Error("ACCOUNT_EXISTS");
      }

      if (existing) {
        return tx.user.update({
          where: { id: existing.id },
          data: { role },
          include: {
            patientProfile: true,
            doctorProfile: true
          }
        });
      }

      return tx.user.create({
        data: {
          name: "Pending MediTrack user",
          email,
          passwordHash: await bcrypt.hash(crypto.randomUUID(), 12),
          role,
          verificationStatus: VerificationStatus.PENDING
        },
        include: {
          patientProfile: true,
          doctorProfile: true
        }
      });
    });

    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "If an account exists, a verification code has been sent."
      });
    }

    const otp = await prisma.$transaction(async (tx) => {
      await tx.verificationOtp.updateMany({
        where: {
          userId: user.id,
          purpose,
          consumedAt: null
        },
        data: { consumedAt: new Date() }
      });

      return tx.verificationOtp.create({
        data: {
          userId: user.id,
          codeHash: await bcrypt.hash(code, 10),
          purpose,
          expiresAt: otpExpiry(purpose)
        }
      });
    });

    otpId = otp.id;
  } catch (error) {
    if (error instanceof Error && error.message === "ACCOUNT_EXISTS") {
      return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to create verification code." }, { status: 500 });
  }

  const delivery = await sendOtpEmail({
    to: email,
    code,
    purpose,
    expiresInMinutes: otpExpiresInMinutes[purpose]
  });

  if (!delivery.delivered && !canReturnDevOtp()) {
    if (otpId) {
      await prisma.verificationOtp
        .update({
          where: { id: otpId },
          data: { consumedAt: new Date() }
        })
        .catch(() => null);
    }

    return NextResponse.json(
      {
        error: "Email OTP delivery is not configured.",
        provider: delivery.provider,
        message: delivery.message
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: delivery.delivered
      ? "Email OTP sent. Check your inbox."
      : "Development OTP generated. Enable Resend before production.",
    expiresInSeconds: otpExpiresInMinutes[purpose] * 60,
    provider: delivery.provider,
    devOtp: canReturnDevOtp() ? code : undefined
  });
}
