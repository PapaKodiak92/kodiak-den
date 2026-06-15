import { NextResponse } from "next/server";
import { clearAuthCookie } from "../../../../lib/authCookies";
import { resetPassword } from "../../../../lib/serverAuth";

export const runtime = "nodejs";

type ResetPasswordBody = {
  identifier?: unknown;
  code?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let body: ResetPasswordBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const identifier = String(body.identifier ?? "").trim();
  const code = String(body.code ?? "").trim();
  const password = String(body.password ?? "");

  if (!identifier) return NextResponse.json({ error: "Enter your email or handle." }, { status: 400 });
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: "Enter the six-digit reset code." }, { status: 400 });

  const result = resetPassword(identifier, code, password);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const response = NextResponse.json({ ok: true, account: result.user });
  clearAuthCookie(response);
  return response;
}
