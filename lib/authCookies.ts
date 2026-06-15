import { NextResponse } from "next/server";

export const authCookieName = "kodiak-den-session";

export function setAuthCookie(response: NextResponse, token: string, expiresAt: string) {
  response.cookies.set({
    name: authCookieName,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: authCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}
