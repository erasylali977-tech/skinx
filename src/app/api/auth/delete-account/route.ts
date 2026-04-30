import { NextResponse } from "next/server";
import { MOCK } from "@/lib/mock";
import { MOCK_COOKIE } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  if (MOCK) {
    res.cookies.set(MOCK_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const serviceClient = createServiceClient();

    // 1. Get all scans to delete images from storage
    const { data: scans } = await supabase
      .from("scans")
      .select("image_path")
      .eq("user_id", userId);

    // 2. Delete images from storage
    if (scans && scans.length > 0) {
      const imagePaths = scans.map(s => s.image_path).filter(Boolean);
      if (imagePaths.length > 0) {
        await serviceClient.storage.from("scans").remove(imagePaths);
      }
    }

    // 3. Delete scans from DB (cascade should handle this, but being explicit)
    await supabase.from("scans").delete().eq("user_id", userId);

    // 4. Delete profile (cascade should handle this too)
    await supabase.from("profiles").delete().eq("id", userId);

    // 5. Delete auth user (requires service role)
    await serviceClient.auth.admin.deleteUser(userId);

    // 6. Clear auth cookies
    await supabase.auth.signOut();

  } catch (e) {
    console.error("[auth/delete-account] error:", e);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return res;
}
