import { NextResponse } from "next/server";
import { setAuthCookie } from "../../../../lib/authCookies";
import { signIn, verifyEmail } from "../../../../lib/serverAuth";

export const runtime = "nodejs";

type VerifyBody = {
  identifier?: unknown;
  code?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let body: VerifyBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const identifier = String(body.identifier ?? "").trim();
  const code = String(body.code ?? "").trim();
  const password = String(body.password ?? "");

  if (!identifier) return NextResponse.json({ error: "Create your Den first." }, { status: 400 });
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: "Enter the six-digit verification code." }, { status: 400 });

  const verification = verifyEmail(identifier, code);

  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ ok: true, account: verification.user });
  }

  const signedIn = signIn(identifier, password);

  if (!signedIn.ok) {
    return NextResponse.json({ ok: true, account: verification.user, needsSignIn: true });
  }

  const response = NextResponse.json({ ok: true, account: signedIn.user });
  setAuthCookie(response, signedIn.token, signedIn.expiresAt);
  return response;
}
