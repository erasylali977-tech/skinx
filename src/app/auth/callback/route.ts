import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// OAuth + email-confirmation callback.
// Supabase redirects here with ?code=... which we exchange for a session cookie.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/home";
  const error = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (error) {
    const signIn = new URL("/sign-in", url);
    signIn.searchParams.set("error", error);
    return NextResponse.redirect(signIn);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in", url));
  }

  const supabase = createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    const signIn = new URL("/sign-in", url);
    signIn.searchParams.set("error", exchangeError.message);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.redirect(new URL(next, url));
}
