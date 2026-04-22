import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";
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
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-semibold text-on-surface-variant">
            <span>Step 1 of 1</span>
            <span>Your profile</span>
          </div>
          <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary-gradient rounded-full w-full" />
          </div>
        </div>

        <div className="space-y-4 pb-2">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Tell us about yourself.
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            This helps us tailor your assessment and track changes accurately.
          </p>
        </div>

        <ProfileForm initial={profile ?? null} />
      </main>
    </div>
  );
}
