import { MOCK, mockGetProfile } from "@/lib/mock";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getProfile(userId: string): Promise<Profile | null> {
  if (MOCK) return mockGetProfile(userId);
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    return data as Profile | null;
  } catch {
    return null;
  }
}
