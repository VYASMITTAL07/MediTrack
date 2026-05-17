import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { requestOrigin } from "@/lib/request";

function logoutResponse(request: NextRequest) {
  const nextPath = request.nextUrl.searchParams.get("next") ?? "/login";
  const response = NextResponse.redirect(new URL(nextPath, requestOrigin(request)), { status: 303 });
  clearSessionCookie(response);
  return response;
}

export async function POST(request: NextRequest) {
  return logoutResponse(request);
}

export async function GET(request: NextRequest) {
  return logoutResponse(request);
}
