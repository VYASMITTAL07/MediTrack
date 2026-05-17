"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  BadgeCheck,
  Building2,
  Camera,
  Fingerprint,
  KeyRound,
  Loader2,
  Send,
  ShieldCheck,
  Stethoscope,
  UserRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Role = "PATIENT" | "DOCTOR" | "ADMIN";

const roleMeta: Record<
  Role,
  {
    label: string;
    icon: typeof UserRound;
    defaultEmail: string;
    destination: string;
    accent: string;
    registerCopy: string;
  }
> = {
  PATIENT: {
    label: "Patient",
    icon: UserRound,
    defaultEmail: "patient@meditrack.ai",
    destination: "/patient",
    accent: "text-emerald-300",
    registerCopy: "Create a verified patient vault with Aadhaar eKYC or face scan."
  },
  DOCTOR: {
    label: "Doctor",
    icon: Stethoscope,
    defaultEmail: "doctor@meditrack.ai",
    destination: "/doctor",
    accent: "text-cyan-300",
    registerCopy: "Create a doctor account with license review and biometric verification."
  },
  ADMIN: {
    label: "Admin",
    icon: Building2,
    defaultEmail: "admin@meditrack.ai",
    destination: "/admin",
    accent: "text-amber-300",
    registerCopy: "Create an admin command account with elevated identity checks."
  }
};

export function RoleLoginCard({ role }: { role: Role }) {
  const meta = roleMeta[role];
  const Icon = meta.icon;
  const [email, setEmail] = useState(meta.defaultEmail);
  const [pin, setPin] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pinStatus, setPinStatus] = useState("Email OTP is optional for local testing and demos.");

  function requestPin() {
    startTransition(async () => {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "SIGN_IN", role })
      }).catch(() => null);
      const data = response ? await response.json().catch(() => null) : null;
      if (!response?.ok) {
        setPinStatus(data?.error ?? "Unable to send email OTP right now.");
        return;
      }
      setPin(data?.devOtp ?? "");
      setPinStatus(data?.message ?? "Email OTP sent for sign in.");
    });
  }

  return (
    <AuthFrame
      eyebrow={`${meta.label} sign in`}
      title={`${meta.label} portal login`}
      description="Use your password to open a role-specific dashboard. Email OTP remains available when needed."
      icon={<Icon className={cn("size-7", meta.accent)} />}
    >
      <form action="/api/auth/login" method="post" className="grid gap-4">
        <input type="hidden" name="role" value={role} />
        <input
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          name="password"
          type="password"
          defaultValue="MediTrack@123"
          className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            name="pin"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="Optional email OTP"
            inputMode="numeric"
            className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="button" variant="secondary" className="rounded-md" onClick={requestPin}>
            {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
            Send OTP
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{pinStatus}</p>
        <Button className="rounded-md">
          <KeyRound className="mr-2 size-4" />
          Enter {meta.label} Portal
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>Need an account?</span>
        <Link className="font-bold text-primary" href={`/${meta.label.toLowerCase()}/register`}>
          Create verified {meta.label.toLowerCase()} account
        </Link>
      </div>
    </AuthFrame>
  );
}

export function RoleRegisterCard({ role }: { role: Role }) {
  const meta = roleMeta[role];
  const Icon = meta.icon;
  const [verificationMethod, setVerificationMethod] = useState<"AADHAAR" | "FACE">("AADHAAR");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [pinStatus, setPinStatus] = useState("Enter email, then request an account OTP.");
  const [isPending, startTransition] = useTransition();

  const verificationHelp = useMemo(() => {
    if (role === "DOCTOR") {
      return "Doctor license is captured first, then Aadhaar or face scan confirms identity.";
    }
    if (role === "ADMIN") {
      return "Admin accounts require stronger review before full production privileges.";
    }
    return "Patient account creation requires identity verification before the health vault opens.";
  }, [role]);

  function requestAccountPin() {
    if (!email.trim()) {
      setPinStatus("Email is required before sending an OTP.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "ACCOUNT_VERIFICATION", role })
      }).catch(() => null);
      const data = response ? await response.json().catch(() => null) : null;
      if (!response?.ok) {
        setPinStatus(data?.error ?? "Unable to send account OTP right now.");
        return;
      }
      setPin(data?.devOtp ?? "");
      setPinStatus(data?.message ?? "Account OTP sent.");
    });
  }

  return (
    <AuthFrame
      eyebrow={`${meta.label} verification`}
      title={`Create ${meta.label.toLowerCase()} account`}
      description={meta.registerCopy}
      icon={<Icon className={cn("size-7", meta.accent)} />}
    >
      <form action="/api/auth/register" method="post" className="grid gap-4">
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="identityMethod" value={verificationMethod} />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            name="name"
            placeholder="Full name"
            required
            className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            name="phone"
            placeholder="Phone"
            className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          name="password"
          type="password"
          placeholder="Strong password"
          defaultValue="MediTrack@123"
          required
          className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
        />
        {role === "DOCTOR" && (
          <input
            name="licenseNumber"
            placeholder="Medical license number"
            required
            className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
          />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <VerificationButton
            active={verificationMethod === "AADHAAR"}
            title="Aadhaar eKYC"
            copy="Enter last 4 digits, then OTP"
            icon={<Fingerprint className="size-5" />}
            onClick={() => setVerificationMethod("AADHAAR")}
          />
          <VerificationButton
            active={verificationMethod === "FACE"}
            title="Face scan"
            copy="Camera consent plus liveness check"
            icon={<Camera className="size-5" />}
            onClick={() => setVerificationMethod("FACE")}
          />
        </div>
        {verificationMethod === "AADHAAR" ? (
          <input
            name="aadhaarLast4"
            placeholder="Aadhaar last 4 digits"
            inputMode="numeric"
            maxLength={4}
            required
            className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
          />
        ) : (
          <label className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm">
            <input name="faceConsent" value="yes" type="checkbox" required className="size-4 accent-teal-400" />
            I consent to face scan verification and liveness review.
          </label>
        )}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            name="pin"
            placeholder="Account creation OTP"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            inputMode="numeric"
            className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="button" variant="secondary" className="rounded-md" onClick={requestAccountPin}>
            {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
            Send OTP
          </Button>
        </div>
        <p className="rounded-md bg-primary/10 p-3 text-xs leading-5 text-muted-foreground">
          {verificationHelp} The email OTP is stored with expiry before this account can be created.
        </p>
        <p className="text-xs text-muted-foreground">{pinStatus}</p>
        <Button className="rounded-md">
          <BadgeCheck className="mr-2 size-4" />
          Verify and create account
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>Already verified?</span>
        <Link className="font-bold text-primary" href={`/${meta.label.toLowerCase()}/login`}>
          Login to {meta.label.toLowerCase()} portal
        </Link>
      </div>
    </AuthFrame>
  );
}

export function RoleGateway({ mode }: { mode: "login" | "register" }) {
  return (
    <section className="min-h-screen px-4 pb-20 pt-32">
      <div className="mx-auto max-w-6xl">
        <Badge>
          <ShieldCheck className="mr-2 size-4 text-primary" />
          Separate role-based access
        </Badge>
        <h1 className="mt-5 font-display text-5xl leading-none tracking-tight md:text-7xl">
          Choose your MediTrack portal.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
          Patient, doctor, and admin access have separate pages so medical data
          stays behind the correct role gate.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {(Object.keys(roleMeta) as Role[]).map((role) => {
            const meta = roleMeta[role];
            const Icon = meta.icon;
            return (
              <Link key={role} href={`/${meta.label.toLowerCase()}/${mode}`}>
                <Card className="h-full transition duration-300 hover:-translate-y-1 hover:bg-foreground/[0.06]">
                  <Icon className={cn("size-9", meta.accent)} />
                  <h2 className="mt-6 text-2xl font-bold">{meta.label}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {mode === "login"
                      ? `Login with password to open the ${meta.label.toLowerCase()} portal.`
                      : meta.registerCopy}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AuthFrame({
  eyebrow,
  title,
  description,
  icon,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid min-h-screen place-items-center px-4 py-28">
      <Card className="relative w-full max-w-2xl overflow-hidden">
        <Badge>{eyebrow}</Badge>
        <div className="mt-6 flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-primary/10">
            {icon}
          </span>
          <div>
            <h1 className="text-3xl font-bold leading-tight tracking-normal">{title}</h1>
            <p className="mt-4 leading-7 text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="relative mt-8">{children}</div>
      </Card>
    </section>
  );
}

function VerificationButton({
  active,
  title,
  copy,
  icon,
  onClick
}: {
  active: boolean;
  title: string;
  copy: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border p-4 text-left transition duration-200",
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-background hover:bg-muted"
      )}
    >
      <span className="mb-4 grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="block font-bold">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{copy}</span>
    </button>
  );
}
