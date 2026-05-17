import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import {
  MedicalAIResponseError,
  MedicalAIUnavailableError,
  medicalDisclaimer,
  runMedicalAI
} from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { findUserForSession } from "@/lib/session";

const chatSchema = z.object({
  message: z.string().min(1)
});

const aiChatResponseSchema = z.object({
  reply: z.string(),
  urgencyLevel: z.string(),
  riskScore: z.number().min(0).max(100),
  precautions: z.array(z.string()).default([]),
  specialistRecommendation: z.string().default("General Medicine"),
  suggestedActions: z.array(z.string()).default([]),
  disclaimer: z.string().default(medicalDisclaimer)
});

async function getPatientContext(userId?: string) {
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { patientProfile: true }
  });

  if (!user?.patientProfile) return null;

  const [medicalRecords, prescriptions, reports, appointments] = await Promise.all([
    prisma.medicalRecord.findMany({
      where: { patientId: user.patientProfile.id },
      orderBy: { occurredAt: "desc" },
      take: 8
    }),
    prisma.prescription.findMany({
      where: { patientId: user.patientProfile.id },
      include: { doctor: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.report.findMany({
      where: { patientId: user.patientProfile.id },
      orderBy: { uploadedAt: "desc" },
      take: 5
    }),
    prisma.appointment.findMany({
      where: { patientId: user.patientProfile.id },
      include: { doctor: { include: { user: true } }, slot: true },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  return {
    patient: {
      name: user.name,
      bloodGroup: user.patientProfile.bloodGroup,
      allergies: user.patientProfile.allergies,
      healthScore: user.patientProfile.healthScore
    },
    medicalRecords: medicalRecords.map((record) => ({
      type: record.type,
      title: record.title,
      summary: record.summary,
      occurredAt: record.occurredAt
    })),
    prescriptions: prescriptions.map((prescription) => ({
      diagnosis: prescription.diagnosis,
      medicines: prescription.medicines,
      instructions: prescription.instructions,
      doctor: prescription.doctor.user.name,
      createdAt: prescription.createdAt
    })),
    reports: reports.map((report) => ({
      title: report.title,
      status: report.verificationStatus,
      confidence: report.aiConfidence,
      flags: report.flags,
      text: report.ocrText
    })),
    appointments: appointments.map((appointment) => ({
      doctor: appointment.doctor.user.name,
      status: appointment.status,
      reason: appointment.reason,
      startsAt: appointment.slot.startsAt
    }))
  };
}

export async function POST(request: NextRequest) {
  const parsed = chatSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const session = await getSessionFromRequest(request);
  const user = await findUserForSession(session);
  const patientContext = await getPatientContext(user?.id);

  try {
    const result = await runMedicalAI<z.infer<typeof aiChatResponseSchema>>({
      system:
        "Answer as an AI medical assistant. Use the authenticated patient context if available. Return JSON with reply, urgencyLevel, riskScore, precautions, specialistRecommendation, suggestedActions, and disclaimer.",
      payload: {
        message: parsed.data.message,
        patientContext
      }
    });

    const aiResponse = aiChatResponseSchema.parse(result.data);

    if (user) {
      await prisma.aiConsultation.create({
        data: {
          userId: user.id,
          prompt: parsed.data.message,
          response: aiResponse.reply,
          riskScore: aiResponse.riskScore,
          urgencyLevel: aiResponse.urgencyLevel,
          model: `${result.provider}:${result.model}`
        }
      });
    }

    return NextResponse.json({
      ...aiResponse,
      model: result.model,
      provider: result.provider
    });
  } catch (error) {
    if (error instanceof MedicalAIUnavailableError || error instanceof MedicalAIResponseError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "AI response did not match the required medical structure." }, { status: 502 });
    }

    return NextResponse.json({ error: "Unable to complete AI consultation." }, { status: 500 });
  }
}
