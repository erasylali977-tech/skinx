import { NextResponse } from "next/server";
import { MOCK_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MOCK_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
