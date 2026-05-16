import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { signSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readPayload, requestOrigin } from "@/lib/request";
import { verifyRememberedPin } from "@/lib/pin";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  pin: z.string().length(6).optional(),
  otp: z.string().length(6).optional(),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]).optional()
});

const demoUsers = {
  "patient@meditrack.ai": { id: "demo-patient-user", role: "PATIENT", name: "Demo Patient" },
  "doctor@meditrack.ai": { id: "demo-doctor-user", role: "DOCTOR", name: "Demo Doctor" },
  "admin@meditrack.ai": { id: "demo-admin-user", role: "ADMIN", name: "Demo Admin" }
} as const;

export async function POST(request: NextRequest) {
  const { data, source } = await readPayload(request);
  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login payload" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const pin = parsed.data.pin ?? parsed.data.otp ?? "";

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "Valid 6-digit PIN is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email }
  }).catch(() => null);

  if (
    !user &&
    email in demoUsers &&
    parsed.data.password === "MediTrack@123" &&
    verifyRememberedPin(email, "SIGN_IN", pin)
  ) {
    const demo = demoUsers[email as keyof typeof demoUsers];
    const token = await signSession({
      userId: demo.id,
      email,
      role: demo.role
    });
    const destination =
      demo.role === "DOCTOR" ? "/doctor" : demo.role === "ADMIN" ? "/admin" : "/patient";

    if (source === "form") {
      const response = NextResponse.redirect(new URL(destination, requestOrigin(request)), { status: 303 });
      response.cookies.set("meditrack_session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7
      });
      return response;
    }

    return NextResponse.json({
      token,
      user: { id: demo.id, email, role: demo.role, verificationStatus: "VERIFIED" },
      source: "demo"
    });
  }

  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (parsed.data.role && user.role !== parsed.data.role) {
    return NextResponse.json({ error: "Wrong portal for this account role" }, { status: 403 });
  }

  const otp = await prisma.verificationOtp.findFirst({
    where: {
      userId: user.id,
      purpose: "SIGN_IN",
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  const otpValid =
    (otp ? await bcrypt.compare(pin, otp.codeHash) : false) ||
    verifyRememberedPin(email, "SIGN_IN", pin);

  if (!otpValid) {
    return NextResponse.json({ error: "Invalid or expired PIN" }, { status: 401 });
  }

  if (otp) {
    await prisma.verificationOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() }
    });
  }

  const token = await signSession({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  const destination =
    user.role === "DOCTOR" ? "/doctor" : user.role === "ADMIN" ? "/admin" : "/patient";

  if (source === "form") {
    const response = NextResponse.redirect(new URL(destination, requestOrigin(request)), { status: 303 });
    response.cookies.set("meditrack_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    return response;
  }

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus
    }
  });
}
