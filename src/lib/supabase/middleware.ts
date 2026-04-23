import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { isProtectedPath, isAuthPath } from "@/lib/authPaths";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  // Never run session logic on /auth/* — the PKCE code-verifier cookie must
  // survive untouched until exchangeCodeForSession() in the route handler.
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    return response;
  }

  const env = getSupabaseEnv();
  if (!env) {
    // Fail open: don't crash the worker if env vars are missing.
    // Protected routes will still return 401 from their handlers.
    // This prevents nginx from seeing a dead upstream (502).
    console.error(
      "[middleware] Supabase env vars missing — skipping session refresh",
    );
    return response;
  }

  let user: { id: string } | null = null;
  try {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    user = data.user ? { id: data.user.id } : null;
  } catch (e) {
    // Network / Supabase outage — don't blow up the request.
    console.error("[middleware] getUser failed:", e);
    return response;
  }

  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPath(pathname) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return response;
}
