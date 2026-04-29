import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserScans, resolveThumb } from "@/lib/scans";
import { MolesContent } from "./MolesContent";

export const dynamic = "force-dynamic";

export default async function MolesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const { scans } = await getUserScans();
  const thumbs = await Promise.all(
    scans.map((s) => resolveThumb(s.image_path)),
  );

  return <MolesContent scans={scans} thumbs={thumbs} />;
}
