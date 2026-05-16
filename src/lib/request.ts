import type { NextRequest } from "next/server";

export async function readPayload<T extends Record<string, unknown>>(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return {
      data: (await request.json()) as T,
      source: "json" as const
    };
  }

  const form = await request.formData();
  return {
    data: Object.fromEntries(form.entries()) as T,
    source: "form" as const
  };
}

export function requestOrigin(request: NextRequest) {
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "") ??
    "http";

  return `${proto}://${host}`;
}
