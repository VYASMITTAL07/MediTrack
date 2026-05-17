import { NextResponse, type NextRequest } from "next/server";
import { VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { verifyAndConsumeOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

const otpSchema = z.object({
  userId: z.string().min(1),
  code: z.string().length(6).optional(),
  pin: z.string().length(6).optional(),
  purpose: z.string().default("ACCOUNT_VERIFICATION")
});

export async function POST(request: NextRequest) {
  const parsed = otpSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid OTP payload" }, { status: 400 });
  }

  const code = parsed.data.pin ?? parsed.data.code ?? "";
  const purpose =
    parsed.data.purpose === "SIGN_IN" || parsed.data.purpose === "ACCOUNT_VERIFICATION"
      ? parsed.data.purpose
      : "ACCOUNT_VERIFICATION";

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
  }

  const verified = await prisma.$transaction(async (tx) => {
    const valid = await verifyAndConsumeOtp({
      tx,
      userId: parsed.data.userId,
      purpose,
      code
    });

    if (!valid) return false;

    await tx.user.update({
      where: { id: parsed.data.userId },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date()
      }
    });

    return true;
  });

  if (!verified) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, status: "VERIFIED" });
}
