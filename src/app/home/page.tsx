import { redirect } from "next/navigation";
import { getUserScans, resolveThumb } from "@/lib/scans";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { HomeContent } from "./HomeContent";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const profile = await getProfile(user.id);

  if (!profile?.onboarded) redirect("/profile");

  const { scans } = await getUserScans();
  const recent = scans.slice(0, 6);
  const thumbs = await Promise.all(recent.map((s) => resolveThumb(s.image_path)));

  const firstName = (profile?.nickname || profile?.full_name || user.email || "there")
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
