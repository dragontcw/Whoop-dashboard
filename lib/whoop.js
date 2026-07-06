// Thin wrapper around the Whoop v2 OAuth + API endpoints.
// Docs: https://developer.whoop.com/docs/introduction

export const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
export const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
export const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v2";

// offline -> required to receive a refresh_token so we don't have to
// re-authenticate every ~1 hour when the access token expires.
export const WHOOP_SCOPES = [
  "offline",
  "read:profile",
  "read:recovery",
  "read:cycles",
  "read:sleep",
  "read:workout",
  "read:body_measurement",
].join(" ");

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function getAuthorizeUrl(state) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: requiredEnv("WHOOP_CLIENT_ID"),
    redirect_uri: requiredEnv("WHOOP_REDIRECT_URI"),
    scope: WHOOP_SCOPES,
    state,
  });
  return `${WHOOP_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: requiredEnv("WHOOP_CLIENT_ID"),
    client_secret: requiredEnv("WHOOP_CLIENT_SECRET"),
    redirect_uri: requiredEnv("WHOOP_REDIRECT_URI"),
  });

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`Whoop token exchange failed (${res.status}): ${await res.text()}`);
  }
  return res.json(); // { access_token, refresh_token, expires_in, token_type, scope }
}

export async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: requiredEnv("WHOOP_CLIENT_ID"),
    client_secret: requiredEnv("WHOOP_CLIENT_SECRET"),
  });

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`Whoop token refresh failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function whoopGet(path, accessToken) {
  const res = await fetch(`${WHOOP_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = new Error(`Whoop API error on ${path} (${res.status}): ${await res.text()}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Pulls the handful of endpoints the dashboard needs, in parallel.
export async function fetchDashboardData(accessToken) {
  const [profile, recovery, sleep, workouts, cycles] = await Promise.all([
    whoopGet("/user/profile/basic", accessToken),
    whoopGet("/recovery?limit=7", accessToken),
    whoopGet("/activity/sleep?limit=7", accessToken),
    whoopGet("/activity/workout?limit=10", accessToken),
    whoopGet("/cycle?limit=7", accessToken),
  ]);

  return { profile, recovery, sleep, workouts, cycles };
}
