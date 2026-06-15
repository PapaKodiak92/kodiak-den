import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieName, clearAuthCookie } from "../../../../lib/authCookies";
import { deleteSession } from "../../../../lib/serverAuth";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  deleteSession(token);

  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  return response;
}
