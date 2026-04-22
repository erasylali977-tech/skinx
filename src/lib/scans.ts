import { createClient } from "@/lib/supabase/server";
import { MOCK, mockListScans, mockGetScan } from "@/lib/mock";
import { getCurrentUser } from "@/lib/auth";
import type { Scan } from "@/lib/types";

export function getSignedThumb(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("mock:")) {
    const id = path.slice(5);
    return `/api/scans/${id}/image`;
  }
  // For real Supabase, we return the path and let the caller resolve it via a helper.
  return null;
}

export async function resolveThumb(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("mock:")) return getSignedThumb(path);
  try {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("scans")
      .createSignedUrl(path, 60 * 60);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export async function getUserScans(): Promise<{ scans: Scan[]; userId: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { scans: [], userId: null };
  if (MOCK) return { scans: mockListScans(user.id), userId: user.id };
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("scans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    return { scans: (data ?? []) as Scan[], userId: user.id };
  } catch {
    return { scans: [], userId: user.id };
  }
}

export async function getScan(id: string): Promise<Scan | null> {
  if (MOCK) return mockGetScan(id);
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("scans")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as Scan) ?? null;
  } catch {
    return null;
  }
}
