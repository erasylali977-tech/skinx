import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { MOCK } from "@/lib/mock";
import { MOCK_COOKIE } from "@/lib/auth";

function mockMiddleware(request: NextRequest) {
  const uid = request.cookies.get(MOCK_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/home") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/scan") ||
    pathname.startsWith("/moles") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/account");
  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";

  if (isProtected && !uid) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (isAuthPage && uid) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  if (MOCK) return mockMiddleware(request);
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
