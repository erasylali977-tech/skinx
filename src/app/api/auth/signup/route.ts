import { NextResponse, type NextRequest } from "next/server";
import { createClient as createAdminBase } from "@supabase/supabase-js";
import { MOCK, mockSignUp } from "@/lib/mock";
import { MOCK_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password, full_name } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
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
      return NextResponse.json({ error: e?.message ?? "Sign-up failed" }, { status: 400 });
    }
  }

  // Real Supabase: create user with email auto-confirmed via Admin API,
  // so the user doesn't need to wait for a confirmation email.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Server misconfigured: missing Supabase env vars" },
      { status: 500 },
    );
  }

  const admin = createAdminBase(url, serviceKey, {
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
      { error: error.message || "Sign-up failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({ user: data.user });
}
