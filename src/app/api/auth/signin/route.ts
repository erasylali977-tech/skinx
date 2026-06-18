import { NextResponse, type NextRequest } from "next/server";
import { MOCK, mockSignIn } from "@/lib/mock";
import { MOCK_COOKIE, MOCK_COOKIE_OPTIONS } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!MOCK) return NextResponse.json({ error: "Not in mock mode" }, { status: 400 });
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });
  try {
    const user = mockSignIn(email, password);
    const res = NextResponse.json({ user });
    res.cookies.set(MOCK_COOKIE, user.id, MOCK_COOKIE_OPTIONS);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Sign-in failed" }, { status: 400 });
  }
}
