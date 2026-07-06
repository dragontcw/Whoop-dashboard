import crypto from "crypto";
import { getAuthorizeUrl } from "@/lib/whoop";
import { STATE_COOKIE_NAME } from "@/lib/session";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");
  const authorizeUrl = getAuthorizeUrl(state);

  // Safari's tracking-prevention rules can silently drop a cookie that is
  // set on the exact same response as a redirect to a different site (our
  // server sending the browser straight to whoop.com). To avoid that, we
  // return a normal page that sets the cookie first, then sends the browser
  // onward to Whoop via a client-side redirect on the next tick.
  const html = `<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <p>Connecting to Whoop…</p>
    <script>window.location.replace(${JSON.stringify(authorizeUrl)});</script>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": `${STATE_COOKIE_NAME}=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}
