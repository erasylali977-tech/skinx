import { NextResponse, type NextRequest } from "next/server";
import { createClient as createAdminBase } from "@supabase/supabase-js";
import { MOCK, mockSignUp } from "@/lib/mock";
import { MOCK_COOKIE } from "@/lib/auth";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

function friendlyError(msg: string): string {
  if (/already registered|already exists|duplicate/i.test(msg))
    return "An account with this email already exists. Please sign in instead.";
  if (/password/i.test(msg))
    return "Password must be at least 6 characters.";
  if (/invalid email/i.test(msg))
    return "Please enter a valid email address.";
  return msg || "Sign-up failed. Please try again.";
}

export async function POST(req: NextRequest) {
  const { email, password, full_name } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (MOCK) {
    try {
      const user = mockSignUp(email, password, full_name || null);
      const res = NextResponse.json({ user });
      res.cookies.set(MOCK_COOKIE, user.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    } catch (e: any) {
      return NextResponse.json({ error: friendlyError(e?.message) }, { status: 400 });
    }
  }

  const env = getSupabaseServiceEnv();
  if (!env) {
    return NextResponse.json(
      { error: "Server misconfigured: missing Supabase env vars" },
      { status: 500 },
    );
  }

  const admin = createAdminBase(env.url, env.serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || null },
  });

  if (error) {
    return NextResponse.json(
      { error: friendlyError(error.message) },
      { status: 400 },
    );
  }

  // Persist full_name to the profiles table (the trigger only creates the row
  // with id, leaving full_name NULL). Non-fatal but worth logging.
  if (full_name && data.user) {
    const { error: profileErr } = await admin
      .from("profiles")
      .update({ full_name: full_name.trim() })
      .eq("id", data.user.id);
    if (profileErr) {
      console.error("[auth/signup] Failed to set profile full_name:", profileErr.message);
    }
  }

  return NextResponse.json({ user: data.user });
}
