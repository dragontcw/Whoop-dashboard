import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptJSON, encryptJSON } from "@/lib/crypto";
import { refreshAccessToken, fetchDashboardData } from "@/lib/whoop";
import { COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/session";

export async function GET() {
  const cookieStore = cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;

  if (!raw) {
    return NextResponse.json({ connected: false });
  }

  let session = decryptJSON(raw);
  if (!session) {
    return NextResponse.json({ connected: false });
  }

  let refreshedCookieValue = null;

  // Refresh a bit early (2 min buffer) rather than waiting for a 401.
  if (Date.now() > session.expires_at - 2 * 60 * 1000) {
    try {
      const refreshed = await refreshAccessToken(session.refresh_token);
      session = {
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token ?? session.refresh_token,
        expires_at: Date.now() + refreshed.expires_in * 1000,
      };
      refreshedCookieValue = encryptJSON(session);
    } catch (err) {
      console.error("Whoop token refresh failed:", err);
      const res = NextResponse.json({ connected: false, error: "session_expired" });
      res.cookies.delete(COOKIE_NAME);
      return res;
    }
  }

  try {
    const data = await fetchDashboardData(session.access_token);
    const res = NextResponse.json({ connected: true, ...data });
    if (refreshedCookieValue) {
      res.cookies.set(COOKIE_NAME, refreshedCookieValue, SESSION_COOKIE_OPTIONS);
    }
    return res;
  } catch (err) {
    console.error("Whoop data fetch failed:", err);
    return NextResponse.json(
      { connected: true, error: "fetch_failed", detail: String(err.message || err) },
      { status: 502 }
    );
  }
}
