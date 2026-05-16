import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const recordSchema = z.object({
  patientId: z.string().min(1),
  type: z.string().default("CONSULTATION"),
  title: z.string().min(1),
  summary: z.string().min(1),
  medicines: z.string().optional(),
  followUpAt: z.string().optional()
});

export async function POST(request: NextRequest) {
  const parsed = recordSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid record payload" }, { status: 400 });
  }

  if (parsed.data.patientId === "demo-patient") {
    return NextResponse.json({
      record: {
        id: `demo-record-${Date.now()}`,
        ...parsed.data,
        verified: true,
        aiSummary: "Saved to the demo patient timeline and ready for longitudinal review."
      },
      source: "demo"
    });
  }

  const record = await prisma.medicalRecord.create({
    data: {
      patientId: parsed.data.patientId,
      type: "CONSULTATION",
      title: parsed.data.title,
      summary: parsed.data.summary,
      occurredAt: new Date(),
      verified: true,
      aiSummary: "Doctor-authored consultation saved after visit.",
      metadata: {
        medicines: parsed.data.medicines,
        followUpAt: parsed.data.followUpAt
      }
    }
  });

  return NextResponse.json({ record, source: "database" });
}
