import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { formatDoctor } from "@/lib/healthcare";
import {
  MedicalAIResponseError,
  MedicalAIUnavailableError,
  medicalDisclaimer,
  runMedicalAI
} from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { findUserForSession } from "@/lib/session";

const analyzeSchema = z.object({
  symptoms: z.string().min(3),
  location: z.string().optional(),
  age: z.number().optional(),
  knownConditions: z.array(z.string()).optional()
});

const aiAnalysisSchema = z.object({
  severity: z.string(),
  urgencyLevel: z.string(),
  healthRiskScore: z.number().min(0).max(100),
  possibleDiseases: z.array(z.string()),
  recommendedSpecializations: z.array(z.string()),
  nearbyClinics: z.array(z.string()).default([]),
  precautions: z.array(z.string()),
  specialistRecommendation: z.string().optional(),
  ratingSystem: z.object({
    urgency: z.number().min(1).max(5),
    specialistMatch: z.number().min(1).max(5),
    followUpNeed: z.number().min(1).max(5)
  }),
  disclaimer: z.string().default(medicalDisclaimer)
});

export async function POST(request: NextRequest) {
  const parsed = analyzeSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Symptoms are required" }, { status: 400 });
  }

  try {
    const result = await runMedicalAI<z.infer<typeof aiAnalysisSchema>>({
      system:
        "Analyze symptoms for a medical record management app. Return JSON with severity, urgencyLevel, healthRiskScore, possibleDiseases, recommendedSpecializations, nearbyClinics, precautions, specialistRecommendation, ratingSystem, and disclaimer.",
      payload: parsed.data
    });

    const analysis = aiAnalysisSchema.parse(result.data);
    const doctorWhere =
      analysis.recommendedSpecializations.length > 0
        ? {
            OR: analysis.recommendedSpecializations.map((specialization) => ({
              specialization: { contains: specialization, mode: "insensitive" as const }
            }))
          }
        : {};
    const doctors = await prisma.doctorProfile.findMany({
      where: doctorWhere,
      include: { user: true, clinic: true },
      orderBy: [{ rating: "desc" }, { experienceYears: "desc" }],
      take: 3
    });

    const session = await getSessionFromRequest(request);
    const user = await findUserForSession(session);
    if (user) {
      await prisma.aiConsultation.create({
        data: {
          userId: user.id,
          prompt: parsed.data.symptoms,
          response: JSON.stringify(analysis),
          riskScore: analysis.healthRiskScore,
          urgencyLevel: analysis.urgencyLevel,
          model: `${result.provider}:${result.model}`
        }
      });
    }

    return NextResponse.json({
      ...analysis,
      recommendedDoctors: doctors.map(formatDoctor),
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

    return NextResponse.json({ error: "Unable to complete symptom analysis." }, { status: 500 });
  }
}
