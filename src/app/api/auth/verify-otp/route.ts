import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { VerificationStatus } from "@prisma/client";
import { z } from "zod";
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
    return NextResponse.json({ error: "Invalid PIN payload" }, { status: 400 });
  }

  const otp = await prisma.verificationOtp.findFirst({
    where: {
      userId: parsed.data.userId,
      purpose: parsed.data.purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  const code = parsed.data.pin ?? parsed.data.code ?? "";

  if (!otp || !(await bcrypt.compare(code, otp.codeHash))) {
    return NextResponse.json({ error: "Invalid or expired PIN" }, { status: 401 });
  }

  await prisma.$transaction([
    prisma.verificationOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date()
      }
    })
  ]);

  return NextResponse.json({ ok: true, status: "VERIFIED" });
}
