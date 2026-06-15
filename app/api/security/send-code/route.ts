import { NextResponse } from "next/server";
import { sendSecurityEmail } from "../../../../lib/serverEmail";

type SecurityCodeKind = "verify" | "reset";

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

  const result = await sendSecurityEmail({ email, code, kind });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error.includes("configured") ? 503 : 502 });
  }

  return NextResponse.json({ ok: true });
}
