import { NextResponse } from "next/server";
import { issuePasswordReset } from "../../../../lib/serverAuth";
import { sendSecurityEmail } from "../../../../lib/serverEmail";

export const runtime = "nodejs";

type ForgotPasswordBody = {
  identifier?: unknown;
};

export async function POST(request: Request) {
  let body: ForgotPasswordBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const identifier = String(body.identifier ?? "").trim();
  if (!identifier) return NextResponse.json({ error: "Enter your email or handle." }, { status: 400 });

  const result = issuePasswordReset(identifier);

  if (result.user && result.code) {
    const emailResult = await sendSecurityEmail({
      email: result.user.email,
      code: result.code,
      kind: "reset",
    });

    if (!emailResult.ok) {
      return NextResponse.json({ error: emailResult.error }, { status: 503 });
    }
  }

  return NextResponse.json({ ok: true });
}
