import type { SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function findUserForSession(session: SessionPayload | null) {
  if (!session) return null;

  return prisma.user.findFirst({
    where: {
      OR: [{ id: session.userId }, { email: session.email }]
    },
    include: {
      patientProfile: true,
      doctorProfile: true
    }
  });
}
