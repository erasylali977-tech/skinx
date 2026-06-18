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

  const warnings: string[] = [];

  try {
    const supabase = createClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();

    if (userErr || !user) {
      console.error("[auth/delete-account] getUser failed:", userErr?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const serviceClient = createServiceClient();

    // 1. Get all scans to delete images from storage
    const { data: scans, error: scansErr } = await supabase
      .from("scans")
      .select("image_path")
      .eq("user_id", userId);
    if (scansErr) {
      console.error("[auth/delete-account] Failed to fetch scans:", scansErr.message);
      warnings.push("Could not fetch scans for cleanup");
    }

    // 2. Delete images from storage
    if (scans && scans.length > 0) {
      const imagePaths = scans.map(s => s.image_path).filter(Boolean);
      if (imagePaths.length > 0) {
        const { error: storageErr } = await serviceClient.storage.from("scans").remove(imagePaths);
        if (storageErr) {
          console.error("[auth/delete-account] Failed to remove images:", storageErr.message);
          warnings.push("Some images may not have been deleted");
        }
      }
    }

    // 3. Delete scans from DB (cascade should handle this, but being explicit)
    const { error: delScansErr } = await supabase.from("scans").delete().eq("user_id", userId);
    if (delScansErr) {
      console.error("[auth/delete-account] Failed to delete scans:", delScansErr.message);
      warnings.push("Scan records may not have been deleted");
    }

    // 4. Delete profile (cascade should handle this too)
    const { error: delProfileErr } = await supabase.from("profiles").delete().eq("id", userId);
    if (delProfileErr) {
      console.error("[auth/delete-account] Failed to delete profile:", delProfileErr.message);
      warnings.push("Profile may not have been deleted");
    }

    // 5. Delete auth user (requires service role) — this is critical
    const { error: delUserErr } = await serviceClient.auth.admin.deleteUser(userId);
    if (delUserErr) {
      console.error("[auth/delete-account] Failed to delete auth user:", delUserErr.message);
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    // 6. Clear auth cookies
    await supabase.auth.signOut();

  } catch (e) {
    console.error("[auth/delete-account] error:", e);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  if (warnings.length > 0) {
    console.warn("[auth/delete-account] Completed with warnings:", warnings);
  }
  return res;
}
