import { NextResponse, type NextRequest } from "next/server";
import { verifySession, type SessionRole } from "@/lib/auth";

const guardedRoutes: Array<{
  prefix: string;
  role: SessionRole;
  publicPaths: string[];
}> = [
  {
    prefix: "/patient",
    role: "PATIENT",
    publicPaths: ["/patient/login", "/patient/register"]
  },
  {
    prefix: "/doctor",
    role: "DOCTOR",
    publicPaths: ["/doctor/login", "/doctor/register"]
  },
  {
    prefix: "/admin",
    role: "ADMIN",
    publicPaths: ["/admin/login", "/admin/register"]
  }
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const route = guardedRoutes.find((item) => pathname.startsWith(item.prefix));

  if (!route || route.publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("meditrack_session")?.value;
  const session = await verifySession(token);

  if (!session || session.role !== route.role) {
    const host = request.headers.get("host") ?? request.nextUrl.host;
    const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
    const loginUrl = new URL(`${route.prefix}/login`, `${proto}://${host}`);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/patient/:path*", "/doctor/:path*", "/admin/:path*"]
};
