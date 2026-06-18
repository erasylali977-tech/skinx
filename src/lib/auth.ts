import { cookies } from "next/headers";
import { MOCK, mockGetUser } from "@/lib/mock";
import { createClient } from "@/lib/supabase/server";

export const MOCK_COOKIE = "skinx_mock_uid";

export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  full_name: string | null;
} | null> {
  if (MOCK) {
    const uid = cookies().get(MOCK_COOKIE)?.value;
    const u = mockGetUser(uid);
    return u;
  }
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email ?? "",
      full_name: (user.user_metadata?.full_name as string) ?? null,
    };
  } catch (e) {
    console.error("[auth] getCurrentUser failed:", e);
    return null;
  }
}
