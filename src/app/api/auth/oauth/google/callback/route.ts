import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { Role, VerificationStatus } from "@prisma/client";
import { signSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requestOrigin } from "@/lib/request";

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.cookies.get("meditrack_oauth_state")?.value;

  if (!code || !state || state !== expectedState) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 401 });
  }

  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ??
    new URL("/api/auth/oauth/google/callback", requestOrigin(request)).toString();

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: "OAuth token exchange failed" }, { status: 401 });
  }

  const token = (await tokenResponse.json()) as GoogleTokenResponse;
  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` }
  });

  if (!profileResponse.ok) {
    return NextResponse.json({ error: "OAuth profile lookup failed" }, { status: 401 });
  }

  const profile = (await profileResponse.json()) as GoogleUserInfo;
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12);

  const user = await prisma.user.upsert({
    where: { email: profile.email.toLowerCase() },
    update: {
      name: profile.name,
      avatarUrl: profile.picture,
      verificationStatus: VerificationStatus.VERIFIED,
      emailVerifiedAt: new Date()
    },
    create: {
      name: profile.name,
      email: profile.email.toLowerCase(),
      avatarUrl: profile.picture,
      passwordHash,
      role: Role.PATIENT,
      verificationStatus: VerificationStatus.VERIFIED,
      emailVerifiedAt: new Date(),
      patientProfile: {
        create: {
          allergies: [],
          qrCode: `MEDITRACK-${profile.sub.slice(-8).toUpperCase()}`
        }
      }
    }
  });

  await prisma.oauthAccount.upsert({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: profile.sub
      }
    },
    update: {
      userId: user.id,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000)
        : undefined
    },
    create: {
      userId: user.id,
      provider: "google",
      providerAccountId: profile.sub,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000)
        : undefined
    }
  });

  const session = await signSession({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  const response = NextResponse.redirect(new URL("/patient", requestOrigin(request)), { status: 303 });
  response.cookies.set("meditrack_session", session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  response.cookies.delete("meditrack_oauth_state");

  return response;
}
