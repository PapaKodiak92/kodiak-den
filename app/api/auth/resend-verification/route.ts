import { NextResponse } from "next/server";
import { issueVerification } from "../../../../lib/serverAuth";
import { sendSecurityEmail } from "../../../../lib/serverEmail";

export const runtime = "nodejs";

type ResendBody = {
  identifier?: unknown;
};

export async function POST(request: Request) {
  let body: ResendBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const identifier = String(body.identifier ?? "").trim();
  if (!identifier) return NextResponse.json({ error: "Create your Den first." }, { status: 400 });

  const result = issueVerification(identifier);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const emailResult = await sendSecurityEmail({
    email: result.user.email,
    code: result.code,
    kind: "verify",
  });

  if (!emailResult.ok) {
    return NextResponse.json({ error: emailResult.error }, { status: 503 });
  }

  return NextResponse.json({ ok: true, account: result.user });
}
