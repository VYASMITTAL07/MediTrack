import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";

export type OtpPurpose = "SIGN_IN" | "ACCOUNT_VERIFICATION";

export const otpExpiresInMinutes: Record<OtpPurpose, number> = {
  SIGN_IN: 5,
  ACCOUNT_VERIFICATION: 10
};

export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function otpExpiry(purpose: OtpPurpose) {
  return new Date(Date.now() + otpExpiresInMinutes[purpose] * 60 * 1000);
}

export async function verifyAndConsumeOtp({
  tx,
  userId,
  purpose,
  code
}: {
  tx: Prisma.TransactionClient;
  userId: string;
  purpose: OtpPurpose;
  code: string;
}) {
  const otp = await tx.verificationOtp.findFirst({
    where: {
      userId,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!otp || !(await bcrypt.compare(code, otp.codeHash))) {
    return false;
  }

  await tx.verificationOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() }
  });

  return true;
}

export function canReturnDevOtp() {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_OTP_RESPONSE === "true";
}
