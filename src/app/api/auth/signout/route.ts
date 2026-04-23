import { NextResponse } from "next/server";
import { MOCK } from "@/lib/mock";
import { MOCK_COOKIE } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  if (MOCK) {
    res.cookies.set(MOCK_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  try {
    const supabase = createClient();
    // Also clears sb-*-auth-token cookies via the SSR cookie adapter.
    await supabase.auth.signOut();
  } catch (e) {
    console.error("[auth/signout] error:", e);
  }
  return res;
}
