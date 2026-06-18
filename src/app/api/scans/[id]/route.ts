import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MOCK, mockDeleteScan, mockGetScan } from "@/lib/mock";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (MOCK) {
    const scan = mockGetScan(params.id);
    if (!scan || scan.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(scan);
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (MOCK) {
    const scan = mockGetScan(params.id);
    if (scan && scan.user_id === user.id) mockDeleteScan(params.id);
    return NextResponse.json({ ok: true });
  }

  try {
    const supabase = createClient();
    const { data: scan } = await supabase
      .from("scans")
      .select("image_path")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!scan) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (scan.image_path) {
      await supabase.storage.from("scans").remove([scan.image_path]);
    }
    const { error } = await supabase.from("scans").delete().eq("id", params.id).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
