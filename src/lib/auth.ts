import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import type { JWTPayload } from "jose";
import type { NextRequest } from "next/server";

const fallbackSecret = "development-secret-change-before-production-32bytes";

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? fallbackSecret);
}

export type SessionRole = "PATIENT" | "DOCTOR" | "ADMIN";

export type SessionPayload = JWTPayload & {
  userId: string;
  email: string;
  role: SessionRole;
};

export async function signSession(payload: {
  userId: string;
  email: string;
  role: SessionRole;
}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token?: string | null) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.replace("Bearer ", "");
  const cookieToken = request.cookies.get("meditrack_session")?.value;
  return verifySession(bearer ?? cookieToken);
}

export function isStrongPassword(password: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

export function maskIdentifier(value: string) {
  if (value.length <= 6) return "*".repeat(value.length);
  return `${value.slice(0, 3)}${"*".repeat(value.length - 6)}${value.slice(-3)}`;
}
