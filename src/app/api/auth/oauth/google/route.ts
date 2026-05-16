import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/request";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ??
    new URL("/api/auth/oauth/google/callback", requestOrigin(request)).toString();

  if (!clientId) {
    return NextResponse.json({
      configured: false,
      message: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google OAuth."
    });
  }

  const state = crypto.randomUUID();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  const response = NextResponse.redirect(url);
  response.cookies.set("meditrack_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  });

  return response;
}
