import { NextResponse } from "next/server";
import { MOCK } from "@/lib/mock";
import { MOCK_COOKIE } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  if (MOCK) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(MOCK_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[auth/signout] signOut error:", error.message);
      return NextResponse.json({ error: "Sign-out failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[auth/signout] error:", e);
    return NextResponse.json({ error: "Sign-out failed" }, { status: 500 });
  }
}
