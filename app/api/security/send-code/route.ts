import { NextResponse } from "next/server";

type SecurityCodeKind = "verify" | "reset";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailCopy(kind: SecurityCodeKind, code: string) {
  if (kind === "reset") {
    return {
      subject: "Your Kodiak Den password reset code",
      heading: "Reset your Kodiak Den password",
      body: "Use this code to reset access to your Den. If you did not ask for this, you can ignore this email.",
      text: `Your Kodiak Den password reset code is ${code}. This code expires soon.`,
    };
  }

  return {
    subject: "Verify your Kodiak Den email",
    heading: "Verify your Kodiak Den email",
    body: "Use this code to finish creating your Den.",
    text: `Your Kodiak Den verification code is ${code}. This code expires soon.`,
  };
}

export async function POST(request: Request) {
  let body: { email?: unknown; code?: unknown; kind?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const code = String(body.code ?? "").trim();
  const kind: SecurityCodeKind = body.kind === "reset" ? "reset" : "verify";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Use a valid email address." }, { status: 400 });
  }

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Use a valid six-digit code." }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "Kodiak Den <onboarding@resend.dev>";

  if (!resendApiKey) {
    return NextResponse.json(
      { error: "Email delivery is not configured. Add RESEND_API_KEY and MAIL_FROM to .env.local." },
      { status: 503 },
    );
  }

  const copy = emailCopy(kind, code);
  const escapedCode = escapeHtml(code);
  const escapedHeading = escapeHtml(copy.heading);
  const escapedBody = escapeHtml(copy.body);

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: copy.subject,
      text: copy.text,
      html: `
        <div style="font-family: Arial, sans-serif; background: #050608; color: #f4f4f5; padding: 32px;">
          <div style="max-width: 560px; margin: 0 auto; border: 1px solid #27272a; border-radius: 24px; padding: 28px; background: #09090b;">
            <p style="margin: 0 0 18px; color: #f59e0b; font-weight: 800;">Kodiak Den</p>
            <h1 style="margin: 0 0 14px; font-size: 28px; line-height: 1.2;">${escapedHeading}</h1>
            <p style="margin: 0 0 24px; color: #a1a1aa; line-height: 1.6;">${escapedBody}</p>
            <div style="letter-spacing: 10px; font-size: 32px; font-weight: 900; color: #fbbf24; padding: 18px 20px; border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 18px; background: rgba(245, 158, 11, 0.10); text-align: center;">
              ${escapedCode}
            </div>
            <p style="margin: 24px 0 0; color: #71717a; font-size: 13px; line-height: 1.6;">This code expires soon. Never share it with anyone.</p>
          </div>
        </div>
      `,
    }),
  });

  if (!resendResponse.ok) {
    return NextResponse.json({ error: "Email provider rejected the message." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
