import { NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/whoop";
import { encryptJSON } from "@/lib/crypto";
import { COOKIE_NAME, STATE_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/session";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const origin = url.origin;

  if (oauthError) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(oauthError)}`);
  }

  const expectedState = request.cookies.get(STATE_COOKIE_NAME)?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/?error=invalid_state`);
  }

  try {
    const tokenData = await exchangeCodeForToken(code);
    const sessionValue = encryptJSON({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
    });

    const res = NextResponse.redirect(`${origin}/`);
    res.cookies.set(COOKIE_NAME, sessionValue, SESSION_COOKIE_OPTIONS);
    res.cookies.delete(STATE_COOKIE_NAME);
    return res;
  } catch (err) {
    console.error("Whoop token exchange failed:", err);
    return NextResponse.redirect(`${origin}/?error=token_exchange_failed`);
  }
}
