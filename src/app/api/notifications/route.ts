import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { formatNotification } from "@/lib/healthcare";
import { sendNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { findUserForSession } from "@/lib/session";

const notificationSchema = z.object({
  userId: z.string().optional(),
  channel: z.enum(["EMAIL", "SMS", "PUSH", "IN_APP"]),
  title: z.string().min(1),
  body: z.string().min(1),
  to: z.string().optional()
});

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const user = await findUserForSession(session);

  if (!session || !user) {
    return NextResponse.json({ notifications: [] }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return NextResponse.json({ notifications: notifications.map(formatNotification) });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const user = await findUserForSession(session);

  if (!session || !user) {
    return NextResponse.json({ error: "Session required" }, { status: 401 });
  }

  const parsed = notificationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid notification payload" }, { status: 400 });
  }

  const result = await sendNotification({
    ...parsed.data,
    userId: parsed.data.userId ?? user.id
  });
  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const user = await findUserForSession(session);

  if (!session || !user) {
    return NextResponse.json({ error: "Session required" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() }
  });

  return NextResponse.json({ ok: true });
}
