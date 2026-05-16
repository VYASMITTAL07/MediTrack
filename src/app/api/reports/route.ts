import { NextResponse, type NextRequest } from "next/server";
import { VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { formatReport } from "@/lib/healthcare";
import { prisma } from "@/lib/prisma";
import { findUserForSession } from "@/lib/session";

const reportSchema = z.object({
  title: z.string().min(1),
  fileName: z.string().min(1).optional(),
  fileUrl: z.string().optional(),
  fileType: z.string().min(1).default("application/octet-stream"),
  ocrText: z.string().optional(),
  hospitalName: z.string().optional(),
  labName: z.string().optional(),
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED", "FLAGGED"]).default("PENDING"),
  aiConfidence: z.number().min(0).max(1).default(0),
  flags: z.array(z.string()).default([])
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

  const report = await prisma.report.create({
    data: {
      patientId: user.patientProfile.id,
      title: parsed.data.title,
      fileUrl: parsed.data.fileUrl ?? `local://${parsed.data.fileName ?? parsed.data.title}`,
      fileType: parsed.data.fileType,
      ocrText: parsed.data.ocrText,
      hospitalName: parsed.data.hospitalName,
      labName: parsed.data.labName,
      verificationStatus: parsed.data.verificationStatus as VerificationStatus,
      aiConfidence: parsed.data.aiConfidence,
      flags: parsed.data.flags
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

  return NextResponse.json({ report: formatReport(report), source: "database" });
}
