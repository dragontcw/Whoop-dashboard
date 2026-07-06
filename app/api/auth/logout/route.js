import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/session";

export async function GET(request) {
  const origin = new URL(request.url).origin;
  const res = NextResponse.redirect(`${origin}/`);
  res.cookies.delete(COOKIE_NAME);
  return res;
}
