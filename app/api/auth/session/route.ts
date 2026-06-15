import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieName } from "../../../../lib/authCookies";
import { getSession } from "../../../../lib/serverAuth";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  const session = getSession(token);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, account: session.user, expiresAt: session.expiresAt });
}
