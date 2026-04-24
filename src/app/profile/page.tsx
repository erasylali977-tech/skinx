import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";
import { ProfilePageHeader } from "./ProfilePageHeader";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentUser } from "@/lib/auth";
import { MOCK, mockGetProfile } from "@/lib/mock";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
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

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32">
      <AppHeader back="/home" />
      <main className="w-full max-w-2xl px-6 pt-24 space-y-8 mx-auto">
        <ProfilePageHeader />
        <ProfileForm initial={profile ?? null} />
      </main>
    </div>
  );
}
