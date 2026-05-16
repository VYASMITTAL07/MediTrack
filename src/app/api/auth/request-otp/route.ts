import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generatePin, rememberPin } from "@/lib/pin";

const requestOtpSchema = z.object({
  email: z.string().email(),
  purpose: z.string().default("SIGN_IN")
});

export async function POST(request: NextRequest) {
  const parsed = requestOtpSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid PIN request" }, { status: 400 });
  }

  const pin = generatePin();
  const email = parsed.data.email.toLowerCase();
  rememberPin(email, parsed.data.purpose, pin);

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      await prisma.verificationOtp.create({
        data: {
          userId: user.id,
          codeHash: await bcrypt.hash(pin, 10),
          purpose: parsed.data.purpose,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        }
      });
    }
  } catch {
    return NextResponse.json({
      ok: true,
      message: "Demo PIN generated. Connect PostgreSQL to persist PIN events.",
      devPin: process.env.NODE_ENV === "production" ? undefined : pin,
      devOtp: process.env.NODE_ENV === "production" ? undefined : pin
    });
  }

  return NextResponse.json({
    ok: true,
    message: "PIN generated for secure sign in.",
    devPin: process.env.NODE_ENV === "production" ? undefined : pin,
    devOtp: process.env.NODE_ENV === "production" ? undefined : pin
  });
}
