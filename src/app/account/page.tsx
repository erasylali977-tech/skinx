import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { MOCK, mockGetProfile } from "@/lib/mock";
import { createClient } from "@/lib/supabase/server";
import { AccountContent } from "./AccountContent";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  let profile: any = null;
  if (MOCK) {
    profile = mockGetProfile(user.id);
  } else {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  return <AccountContent email={user.email ?? ""} full_name={profile?.full_name} profile={profile} />;
}
