import { clamp } from "@/lib/utils";

export type ReportVerificationInput = {
  title: string;
  fileName: string;
  fileType: string;
  extractedText?: string;
  hospitalName?: string;
};

export function verifyReportLocally(input: ReportVerificationInput) {
  const text = `${input.title} ${input.fileName} ${input.extractedText ?? ""} ${
    input.hospitalName ?? ""
  }`.toLowerCase();

  const positiveSignals = [
    "lab",
    "hospital",
    "report",
    "patient",
    "doctor",
    "date",
    "reference",
    "pathology",
    "radiology"
  ].filter((signal) => text.includes(signal)).length;

  const suspiciousSignals = [
    "edited",
    "photoshop",
    "sample",
    "dummy",
    "template",
    "fake",
    "test only"
  ].filter((signal) => text.includes(signal)).length;

  const typeScore =
    input.fileType.includes("pdf") || input.fileType.includes("image") ? 18 : -10;
  const score = clamp(58 + positiveSignals * 7 + typeScore - suspiciousSignals * 22, 5, 98);

  return {
    status: score > 78 ? "VERIFIED" : score > 55 ? "PENDING" : "FLAGGED",
    confidence: score / 100,
    extractedText:
      input.extractedText ??
      "OCR simulator: patient metadata, issuing facility, report date, and clinical observations detected.",
    flags:
      suspiciousSignals > 0
        ? ["Suspicious manipulation keywords detected", "Manual admin review required"]
        : score < 78
          ? ["Insufficient issuer metadata", "Needs manual verification"]
          : [],
    verifiedBadge: score > 78
  };
}
