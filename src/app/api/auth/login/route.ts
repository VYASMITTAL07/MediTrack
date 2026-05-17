import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { setSessionCookie, signSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readPayload, requestOrigin } from "@/lib/request";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  pin: z.string().length(6).optional(),
  otp: z.string().length(6).optional(),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]).optional()
});

export async function POST(request: NextRequest) {
  const { data, source } = await readPayload(request);
  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login payload" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (parsed.data.role && user.role !== parsed.data.role) {
    return NextResponse.json({ error: "Wrong portal for this account role" }, { status: 403 });
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
    setSessionCookie(response, token);
    return response;
  }

  const response = NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus
    }
  });
  setSessionCookie(response, token);
  return response;
}
