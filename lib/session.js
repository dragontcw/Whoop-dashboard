export const COOKIE_NAME = "whoop_session";
export const STATE_COOKIE_NAME = "whoop_oauth_state";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 180, // 180 days — refresh_token keeps the session alive
  path: "/",
};
