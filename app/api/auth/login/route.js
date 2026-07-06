import crypto from "crypto";
import { NextResponse } from "next/server";
import { getAuthorizeUrl } from "@/lib/whoop";
import { STATE_COOKIE_NAME } from "@/lib/session";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");
  const authorizeUrl = getAuthorizeUrl(state);

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes is plenty to complete the Whoop login screen
    path: "/",
  });
  return res;
}
