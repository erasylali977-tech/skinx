import { NextResponse, type NextRequest } from "next/server";
import { MOCK, mockUpsertProfile, mockGetProfile } from "@/lib/mock";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (MOCK) return NextResponse.json(mockGetProfile(user.id));
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (MOCK) {
    const next = mockUpsertProfile(user.id, {
      nickname: body.nickname ?? null,
      avatar: body.avatar ?? "👤",
      age_range: body.age_range ?? null,
      sex: body.sex ?? null,
      skin_type: body.skin_type ?? null,
      risk_factors: body.risk_factors ?? [],
      onboarded: true,
      full_name: body.full_name ?? user.full_name ?? null,
    });
    return NextResponse.json(next);
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: body.full_name ?? user.full_name ?? null,
        nickname: body.nickname ?? null,
        avatar: body.avatar ?? "👤",
        age_range: body.age_range ?? null,
        sex: body.sex ?? null,
        skin_type: body.skin_type ?? null,
        risk_factors: body.risk_factors ?? [],
        onboarded: true,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
