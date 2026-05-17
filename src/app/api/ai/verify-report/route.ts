import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  MedicalAIResponseError,
  MedicalAIUnavailableError
} from "@/lib/openai";
import { reportAIInputSchema, verifyReportWithAI } from "@/lib/report-ai";

export async function POST(request: NextRequest) {
  const parsed = reportAIInputSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report payload" }, { status: 400 });
  }

  try {
    const result = await verifyReportWithAI(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MedicalAIUnavailableError || error instanceof MedicalAIResponseError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "AI response did not match the required report structure." }, { status: 502 });
    }

    return NextResponse.json({ error: "Unable to verify report." }, { status: 500 });
  }
}
