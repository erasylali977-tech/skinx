import { redirect } from "next/navigation";
import { getUserScans, resolveThumb } from "@/lib/scans";
import { getCurrentUser } from "@/lib/auth";
import { MOCK, mockGetProfile } from "@/lib/mock";
import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "./HomeContent";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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

  if (!profile?.onboarded) redirect("/profile");

  const { scans } = await getUserScans();
  const recent = scans.slice(0, 6);
  const thumbs = await Promise.all(recent.map((s) => resolveThumb(s.image_path)));

  const firstName = (profile?.full_name || user.email || "there")
    .toString()
    .split(" ")[0]
    .split("@")[0];

  return (
    <HomeContent
      firstName={firstName}
      scans={recent}
      thumbs={thumbs}
    />
  );
}
