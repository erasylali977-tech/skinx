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

  const redirectToSignIn = (msg: string) => {
    const signIn = new URL("/sign-in", url);
    signIn.searchParams.set("error", msg);
    return NextResponse.redirect(signIn);
  };

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
      return redirectToSignIn(exchangeError.message);
    }

    return NextResponse.redirect(new URL(next, url));
  } catch (e: any) {
    console.error("[auth/callback] Unhandled:", e);
    return redirectToSignIn(e?.message || "Auth callback failed");
  }
}
