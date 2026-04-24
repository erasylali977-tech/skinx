import { getUserScans, resolveThumb } from "@/lib/scans";
import { DashboardContent } from "./DashboardContent";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { scans } = await getUserScans();
  const thumbs = await Promise.all(
    scans.map((s) => resolveThumb(s.image_path)),
  );

  return <DashboardContent scans={scans} thumbs={thumbs} />;
}
