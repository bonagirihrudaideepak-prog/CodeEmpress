import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight session check for route protection.
 * Uses the AUTH_SECRET-based JWT cookie to decide whether to allow access.
 * NextAuth v5 uses the `authjs.` prefix by default; the legacy `next-auth.`
 * prefix is accepted too. The authoritative check happens in each server
 * component / action.
 */
export function proxy(req: NextRequest) {
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("next-auth.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token");

  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/resume", "/roadmap", "/roadmaps/:path*", "/chat", "/courses/:path*", "/content/:path*", "/forge", "/library/:path*", "/ai-status", "/profile", "/career", "/search", "/mailbox", "/settings"],
};
