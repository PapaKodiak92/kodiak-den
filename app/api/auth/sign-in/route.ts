import { NextResponse } from "next/server";
import { setAuthCookie } from "../../../../lib/authCookies";
import { issueVerification, signIn } from "../../../../lib/serverAuth";
import { sendSecurityEmail } from "../../../../lib/serverEmail";

export const runtime = "nodejs";

type SignInBody = {
  identifier?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let body: SignInBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const identifier = String(body.identifier ?? "").trim();
  const password = String(body.password ?? "");

  if (!identifier) return NextResponse.json({ error: "Enter your email or handle." }, { status: 400 });
  if (!password) return NextResponse.json({ error: "Enter your password." }, { status: 400 });

  const result = signIn(identifier, password);

  if (!result.ok) {
    if (result.code === "EMAIL_UNVERIFIED") {
      const verification = issueVerification(identifier);

      if (verification.ok) {
        await sendSecurityEmail({
          email: verification.user.email,
          code: verification.code,
          kind: "verify",
        });
      }
    }

    return NextResponse.json(
      { error: result.error, code: result.code, account: result.user },
      { status: result.status },
    );
  }

  const response = NextResponse.json({ ok: true, account: result.user });
  setAuthCookie(response, result.token, result.expiresAt);
  return response;
}
