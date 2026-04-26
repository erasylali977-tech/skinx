import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { MOCK } from "@/lib/mock";

function mockMiddleware(request: NextRequest) {
  // In mock/dev mode skip auth enforcement so UI can be tested without registration
  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  try {
    if (MOCK) return mockMiddleware(request);
    return await updateSession(request);
  } catch (e) {
    // Last-resort guard: never let middleware crash the worker,
    // otherwise nginx returns 502 on every request.
    console.error("[middleware] unhandled error:", e);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Exclude static assets, images, service worker, and — critically —
    // /auth/* routes so middleware never calls getUser() while the PKCE
    // code-verifier cookie is in flight (would trigger cleanup and clear it,
    // causing "invalid flow state" on exchangeCodeForSession).
    "/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.webmanifest|auth/|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
