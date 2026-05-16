import type { SessionPayload, SessionRole } from "@/lib/auth";

const permissions: Record<SessionRole, string[]> = {
  PATIENT: [
    "records:read:self",
    "appointments:book",
    "ai:consult",
    "reports:upload"
  ],
  DOCTOR: [
    "appointments:read:assigned",
    "records:read:assigned",
    "records:write:consultation",
    "prescriptions:write"
  ],
  ADMIN: [
    "users:manage",
    "doctors:verify",
    "clinics:verify",
    "reports:moderate",
    "analytics:read"
  ]
};

export function can(session: SessionPayload | null, permission: string) {
  if (!session) return false;
  return permissions[session.role]?.includes(permission) ?? false;
}

export function requireRole(session: SessionPayload | null, roles: SessionRole[]) {
  return Boolean(session && roles.includes(session.role));
}
