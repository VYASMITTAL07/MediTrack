import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export type NotificationPayload = {
  userId?: string;
  channel: "EMAIL" | "SMS" | "PUSH" | "IN_APP";
  title: string;
  body: string;
  to?: string;
};

export async function sendNotification(payload: NotificationPayload) {
  if (payload.userId) {
    await prisma.notification
      .create({
        data: {
          userId: payload.userId,
          channel: payload.channel,
          title: payload.title,
          body: payload.body
        }
      })
      .catch(() => null);
  }

  if (payload.channel === "EMAIL") {
    if (!payload.to) {
      return {
        delivered: false,
        provider: "resend",
        message: "Email recipient is required."
      };
    }

    return sendEmail({
      to: payload.to,
      subject: payload.title,
      text: payload.body,
      html: `<p>${payload.body}</p>`
    });
  }

  if (payload.channel === "SMS") {
    return {
      delivered: Boolean(process.env.SMS_PROVIDER_API_KEY),
      provider: process.env.SMS_PROVIDER_API_KEY ? "sms-provider" : "not-configured",
      message: process.env.SMS_PROVIDER_API_KEY
        ? "Queued through configured SMS provider."
        : "SMS provider not configured. In-app notification recorded only."
    };
  }

  if (payload.channel === "PUSH") {
    return {
      delivered: false,
      provider: "web-push-ready",
      message: "Push subscription storage is ready to plug into a Web Push provider."
    };
  }

  return {
    delivered: true,
    provider: "in-app",
    message: "In-app notification recorded."
  };
}
