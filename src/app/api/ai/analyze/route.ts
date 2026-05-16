import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { doctors } from "@/lib/data";
import { medicalDisclaimer, runMedicalAI } from "@/lib/openai";

const analyzeSchema = z.object({
  symptoms: z.string().min(3),
  location: z.string().optional(),
  age: z.number().optional(),
  knownConditions: z.array(z.string()).optional()
});

export async function POST(request: NextRequest) {
  const parsed = analyzeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Symptoms are required" }, { status: 400 });
  }

  const fallback = {
    severity: "moderate",
    urgencyLevel: parsed.data.symptoms.toLowerCase().includes("chest") ? "urgent" : "routine",
    healthRiskScore: parsed.data.symptoms.toLowerCase().includes("chest") ? 78 : 42,
    possibleDiseases: ["Viral infection", "Stress response", "Specialist review needed"],
    recommendedSpecializations: parsed.data.symptoms.toLowerCase().includes("chest")
      ? ["Cardiology", "Emergency Medicine"]
      : ["General Medicine", "Internal Medicine"],
    recommendedDoctors: doctors,
    nearbyClinics: ["MediTrack Precision Clinic", "NeuroVista Medical Hub", "BreathWell Clinic"],
    precautions: [
      "Track symptom duration and triggers",
      "Hydrate and rest",
      "Avoid self-medication without clinician review",
      "Seek emergency care for red flags"
    ],
    ratingSystem: {
      urgency: 4,
      specialistMatch: 5,
      followUpNeed: 4
    },
    disclaimer: medicalDisclaimer
  };

  const result = await runMedicalAI({
    system:
      "Analyze symptoms for a medical record management app. Return JSON with severity, urgencyLevel, healthRiskScore, possibleDiseases, recommendedSpecializations, precautions, ratingSystem, and disclaimer.",
    payload: parsed.data,
    fallback
  });

  return NextResponse.json({
    ...result.data,
    model: result.model,
    usedFallback: result.usedFallback
  });
}
