import { notFound } from "next/navigation";
import { getScan, resolveThumb, getUserScans } from "@/lib/scans";
import { MoleContent } from "./MoleContent";

export const dynamic = "force-dynamic";

export default async function MoleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const scan = await getScan(params.id);
  if (!scan) notFound();

  const [latestUrl, { scans }] = await Promise.all([
    resolveThumb(scan.image_path),
    getUserScans(),
  ]);

  const sameArea = scan.body_area
    ? scans.filter((s) => s.body_area === scan.body_area)
    : [scan];
  const baseline = sameArea[sameArea.length - 1] ?? scan;
  const baselineUrl =
    baseline.id === scan.id ? latestUrl : await resolveThumb(baseline.image_path);

  return (
    <MoleContent
      scan={scan}
      sameArea={sameArea}
      latestUrl={latestUrl}
      baselineUrl={baselineUrl}
    />
  );
}
