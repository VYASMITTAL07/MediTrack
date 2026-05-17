import { z } from "zod";
import { runMedicalAI } from "@/lib/openai";

export const reportAIInputSchema = z.object({
  title: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  extractedText: z.string().optional(),
  hospitalName: z.string().optional()
});

export const reportVerificationSchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "REJECTED", "FLAGGED"]),
  confidence: z.number().min(0).max(1),
  extractedText: z.string(),
  summary: z.string(),
  flags: z.array(z.string()),
  verifiedBadge: z.boolean()
});

export async function verifyReportWithAI(input: z.infer<typeof reportAIInputSchema>) {
  const result = await runMedicalAI<z.infer<typeof reportVerificationSchema>>({
    system:
      "Review medical report metadata and OCR text for authenticity signals. Return JSON with status, confidence, extractedText, summary, flags, and verifiedBadge. Use PENDING when evidence is incomplete, FLAGGED for suspicious metadata, REJECTED for clearly invalid medical documents, and VERIFIED only when issuer and clinical structure look credible.",
    payload: input
  });

  return {
    verification: reportVerificationSchema.parse(result.data),
    model: result.model,
    provider: result.provider
  };
}
