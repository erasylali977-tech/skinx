import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// OAuth + email-confirmation callback.
// Supabase redirects here with ?code=... which we exchange for a session cookie.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/home";
  const oauthError =
    url.searchParams.get("error_description") || url.searchParams.get("error");

  // Behind nginx, request.nextUrl.origin is http://localhost:3000 (internal).
  // Use NEXT_PUBLIC_APP_URL if set, otherwise reconstruct from X-Forwarded headers
  // so the browser is redirected to the real public origin (e.g. https://skinx.fit).
  const publicOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (() => {
      const proto =
        request.headers.get("x-forwarded-proto") ??
        url.protocol.replace(":", "");
      const host = request.headers.get("host") ?? url.host;
      return `${proto}://${host}`;
    })();

  const redirectToSignIn = (msg: string) =>
    NextResponse.redirect(
      `${publicOrigin}/sign-in?error=${encodeURIComponent(msg)}`,
    );

  try {
    if (oauthError) return redirectToSignIn(oauthError);
    if (!code) return redirectToSignIn("Missing auth code");

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error("[auth/callback] Missing Supabase env vars on server");
      return redirectToSignIn("Server misconfigured: Supabase env vars missing");
    }

    const supabase = createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error("[auth/callback] exchangeCodeForSession:", exchangeError);
      // "invalid flow state" = PKCE verifier cookie lost, usually means:
      // 1. This callback URL is not in Supabase → Auth → URL Configuration → Redirect URLs
      // 2. The user opened the link in a different browser / incognito tab
      const isFlowState = exchangeError.message.toLowerCase().includes("flow state");
      const userMessage = isFlowState
        ? "Sign-in session expired. Please try signing in again."
        : exchangeError.message;
      return redirectToSignIn(userMessage);
    }

    const safePath = next.startsWith("/") && !next.startsWith("//") ? next : "/home";
    return NextResponse.redirect(`${publicOrigin}${safePath}`);
  } catch (e: any) {
    console.error("[auth/callback] Unhandled:", e);
    return redirectToSignIn(e?.message || "Auth callback failed");
  }
}
