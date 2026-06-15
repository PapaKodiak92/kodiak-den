import { NextResponse } from "next/server";
import { createUser } from "../../../../lib/serverAuth";
import { sendSecurityEmail } from "../../../../lib/serverEmail";

export const runtime = "nodejs";

type CreateAccountBody = {
  displayName?: unknown;
  handle?: unknown;
  email?: unknown;
  password?: unknown;
  profileVisibility?: unknown;
};

export async function POST(request: Request) {
  let body: CreateAccountBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = createUser({
    displayName: String(body.displayName ?? ""),
    handle: String(body.handle ?? ""),
    email: String(body.email ?? ""),
    password: String(body.password ?? ""),
    profileVisibility:
      body.profileVisibility === "Pack only" || body.profileVisibility === "Private"
        ? body.profileVisibility
        : "Public",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const emailResult = await sendSecurityEmail({
    email: result.user.email,
    code: result.code,
    kind: "verify",
  });

  if (!emailResult.ok) {
    return NextResponse.json({ error: `Account created, but verification email failed: ${emailResult.error}` }, { status: 503 });
  }

  return NextResponse.json({ ok: true, account: result.user });
}
