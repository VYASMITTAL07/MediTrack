import { NextResponse, type NextRequest } from "next/server";
import { VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { formatReport } from "@/lib/healthcare";
import { MedicalAIResponseError, MedicalAIUnavailableError } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { verifyReportWithAI } from "@/lib/report-ai";
import { findUserForSession } from "@/lib/session";

const reportSchema = z.object({
  title: z.string().min(1),
  fileName: z.string().min(1).optional(),
  fileUrl: z.string().optional(),
  fileType: z.string().min(1).default("application/octet-stream"),
  extractedText: z.string().optional(),
  ocrText: z.string().optional(),
  hospitalName: z.string().optional(),
  labName: z.string().optional()
});

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const user = await findUserForSession(session);

  if (!session || !user) {
    return NextResponse.json({ reports: [] }, { status: 401 });
  }

  const reports = await prisma.report.findMany({
    where:
      session.role === "PATIENT" && user.patientProfile
        ? { patientId: user.patientProfile.id }
        : session.role === "DOCTOR" && user.doctorProfile
          ? { patient: { appointments: { some: { doctorId: user.doctorProfile.id } } } }
          : {},
    orderBy: { uploadedAt: "desc" },
    take: 50
  });

  return NextResponse.json({ reports: reports.map(formatReport), source: "database" });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const user = await findUserForSession(session);

  if (!session || !user || session.role !== "PATIENT" || !user.patientProfile) {
    return NextResponse.json({ error: "Patient session required to upload reports" }, { status: 401 });
  }

  const parsed = reportSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report payload" }, { status: 400 });
  }

  try {
    const aiResult = await verifyReportWithAI({
      title: parsed.data.title,
      fileName: parsed.data.fileName ?? parsed.data.title,
      fileType: parsed.data.fileType,
      extractedText: parsed.data.extractedText ?? parsed.data.ocrText,
      hospitalName: parsed.data.hospitalName
    });

    const report = await prisma.report.create({
      data: {
        patientId: user.patientProfile.id,
        title: parsed.data.title,
        fileUrl: parsed.data.fileUrl ?? `local://${parsed.data.fileName ?? parsed.data.title}`,
        fileType: parsed.data.fileType,
        ocrText: [aiResult.verification.extractedText, `AI summary: ${aiResult.verification.summary}`]
          .filter(Boolean)
          .join("\n\n"),
        hospitalName: parsed.data.hospitalName,
        labName: parsed.data.labName,
        verificationStatus: aiResult.verification.status as VerificationStatus,
        aiConfidence: aiResult.verification.confidence,
        flags: aiResult.verification.flags
      }
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        channel: "IN_APP",
        title: "Report uploaded",
        body: `${report.title} was saved with ${report.verificationStatus.toLowerCase()} verification status.`
      }
    });

    return NextResponse.json({
      report: formatReport(report),
      verification: aiResult.verification,
      model: aiResult.model,
      provider: aiResult.provider,
      source: "database"
    });
  } catch (error) {
    if (error instanceof MedicalAIUnavailableError || error instanceof MedicalAIResponseError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "AI response did not match the required report structure." }, { status: 502 });
    }

    return NextResponse.json({ error: "Unable to verify and save report." }, { status: 500 });
  }
}
