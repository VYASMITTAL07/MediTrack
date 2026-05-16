import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { medicalTimeline } from "@/lib/data";
import { medicalDisclaimer, runMedicalAI } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

const chatSchema = z.object({
  message: z.string().min(1),
  patientId: z.string().optional()
});

export async function POST(request: NextRequest) {
  const parsed = chatSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const fallback = {
    reply:
      "I reviewed the available timeline context. Your symptoms may be manageable, but if they are severe, sudden, worsening, or include chest pain, breathing trouble, weakness, fainting, or confusion, seek emergency care. Otherwise, book a relevant specialist and keep tracking symptom timing, triggers, medicines, and vitals.",
    urgencyLevel: parsed.data.message.toLowerCase().includes("chest") ? "urgent" : "routine",
    riskScore: parsed.data.message.toLowerCase().includes("chest") ? 76 : 38,
    suggestedActions: ["Book specialist appointment", "Upload related reports", "Set follow-up reminder"],
    disclaimer: medicalDisclaimer
  };

  const result = await runMedicalAI({
    system:
      "Answer as an AI medical assistant. Use the patient timeline context, give safe next steps, and return JSON with reply, urgencyLevel, riskScore, suggestedActions, and disclaimer.",
    payload: {
      message: parsed.data.message,
      timeline: medicalTimeline
    },
    fallback
  });

  const session = await getSessionFromRequest(request);
  if (session) {
    await prisma.aiConsultation
      .create({
        data: {
          userId: session.userId,
          prompt: parsed.data.message,
          response: result.data.reply,
          riskScore: result.data.riskScore,
          urgencyLevel: result.data.urgencyLevel,
          model: result.model
        }
      })
      .catch(() => null);
  }

  return NextResponse.json({
    ...result.data,
    model: result.model,
    usedFallback: result.usedFallback
  });
}
