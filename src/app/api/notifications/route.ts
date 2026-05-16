import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendNotification } from "@/lib/notifications";

const notificationSchema = z.object({
  userId: z.string().optional(),
  channel: z.enum(["EMAIL", "SMS", "PUSH", "IN_APP"]),
  title: z.string().min(1),
  body: z.string().min(1),
  to: z.string().optional()
});

export async function POST(request: NextRequest) {
  const parsed = notificationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid notification payload" }, { status: 400 });
  }

  const result = await sendNotification(parsed.data);
  return NextResponse.json(result);
}
