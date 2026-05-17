export type EmailDeliveryResult = {
  delivered: boolean;
  provider: "resend";
  message: string;
  id?: string;
};

type ResendEmailResponse = {
  id?: string;
  message?: string;
  name?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
console.log("RESEND KEY:", process.env.RESEND_API_KEY);
console.log("FROM:", process.env.RESEND_FROM_EMAIL);
  if (!apiKey) {
    return {
      delivered: false,
      provider: "resend",
      message: "RESEND_API_KEY is not configured."
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "MediTrack <onboarding@resend.dev>",
      to,
      subject,
      html,
      text
    })
  });

  const body = (await response.json().catch(() => ({}))) as ResendEmailResponse;

  if (!response.ok) {
    return {
      delivered: false,
      provider: "resend",
      message: body.message ?? body.name ?? "Resend rejected the email request."
    };
  }

  return {
    delivered: true,
    provider: "resend",
    message: "Email queued through Resend.",
    id: body.id
  };
}

export async function sendOtpEmail({
  to,
  code,
  purpose,
  expiresInMinutes
}: {
  to: string;
  code: string;
  purpose: "SIGN_IN" | "ACCOUNT_VERIFICATION";
  expiresInMinutes: number;
}) {
  const label = purpose === "SIGN_IN" ? "sign in" : "account verification";
  const subject = `Your MediTrack ${label} code`;
  const text = `Your MediTrack ${label} code is ${code}. It expires in ${expiresInMinutes} minutes. If you did not request this, ignore this email.`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Your MediTrack ${label} code is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>
      <p>This code expires in ${expiresInMinutes} minutes.</p>
      <p style="color:#64748b">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}
