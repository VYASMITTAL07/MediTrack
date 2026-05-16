import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { runMedicalAI } from "@/lib/openai";
import { verifyReportLocally } from "@/lib/verification";

const reportSchema = z.object({
  title: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  extractedText: z.string().optional(),
  hospitalName: z.string().optional()
});

export async function POST(request: NextRequest) {
  const parsed = reportSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report payload" }, { status: 400 });
  }

  const local = verifyReportLocally(parsed.data);
  const result = await runMedicalAI({
    system:
      "Verify medical report authenticity. Return JSON with status, confidence, extractedText, flags, and verifiedBadge.",
    payload: parsed.data,
    fallback: local
  });

  return NextResponse.json({
    verification: result.data,
    model: result.model,
    usedFallback: result.usedFallback
  });
}
