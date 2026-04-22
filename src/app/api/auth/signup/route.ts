import { NextResponse, type NextRequest } from "next/server";
import { MOCK, mockSignUp } from "@/lib/mock";
import { MOCK_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!MOCK) return NextResponse.json({ error: "Not in mock mode" }, { status: 400 });
  const { email, password, full_name } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });
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
