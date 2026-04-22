import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { getUserScans, resolveThumb } from "@/lib/scans";
import { formatDate, riskLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { scans } = await getUserScans();
  const thumbs = await Promise.all(
    scans.map((s) => resolveThumb(s.image_path)),
  );

  const total = scans.length;
  const stable = scans.filter((s) => s.risk_level === "low").length;
  const review = scans.filter((s) => s.risk_level === "high").length;

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32 pt-24">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-6">
        <section className="mb-12 mt-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Dashboard
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl">
            Monitor your skin health.{" "}
            {review > 0
              ? `${review} spot${review > 1 ? "s" : ""} need${review > 1 ? "" : "s"} attention.`
              : total > 0
                ? "All tracked spots are stable."
                : "Start your first scan to begin tracking."}
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            label="Total Tracked"
            value={total}
            footer={total > 0 ? "Latest scans synced" : "No scans yet"}
            icon="data_usage"
          />
          <StatCard
            label="Stable Spots"
            value={stable}
            footer="No change"
            icon="check_circle"
            accent="emerald"
          />
          <StatCard
            label="Review Needed"
            value={review}
            footer={review > 0 ? "Action required" : "All clear"}
            icon="warning"
            accent="orange"
          />
        </section>

        <section>
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              Your Skin Cards
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {scans.map((s, i) => (
              <Link
                key={s.id}
                href={`/moles/${s.id}`}
                className="bg-surface-container-lowest rounded-xl overflow-hidden group hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <div className="aspect-square w-full relative bg-surface-container-low">
                  {thumbs[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbs[i] as string}
                      alt={s.body_area || "scan"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon
                        name="image"
                        className="text-6xl text-outline-variant"
                      />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span
                      className={`w-2 h-2 rounded-full ${s.risk_level === "high" ? "bg-orange-500" : s.risk_level === "medium" ? "bg-amber-400" : "bg-emerald-500"}`}
                    />
                    <span className="text-xs font-semibold">
                      {riskLabel(s.risk_level)}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-1">
                    {s.body_area || "Skin Check"}
                  </h3>
                  <div className="flex justify-between items-center text-sm text-on-surface-variant">
                    <span>Scanned {formatDate(s.created_at)}</span>
                    <Icon
                      name="arrow_forward"
                      className="text-outline group-hover:text-primary transition-colors"
                    />
                  </div>
                </div>
              </Link>
            ))}

            <Link
              href="/scan"
              className="bg-surface-container-low rounded-xl overflow-hidden group hover:bg-surface-container-highest transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[280px]"
            >
              <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Icon name="add" className="text-3xl" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-1">
                Track New Spot
              </h3>
              <p className="text-sm text-on-surface-variant text-center px-6">
                Take a photo to start tracking a new area.
              </p>
            </Link>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

function StatCard({
  label,
  value,
  footer,
  icon,
  accent,
}: {
  label: string;
  value: number;
  footer: string;
  icon: string;
  accent?: "emerald" | "orange";
}) {
  const accentBar =
    accent === "emerald"
      ? "from-emerald-400 to-emerald-600"
      : accent === "orange"
        ? "from-orange-400 to-orange-600"
        : "from-primary to-primary-container";
  const chip =
    accent === "emerald"
      ? "text-emerald-700 bg-emerald-50"
      : accent === "orange"
        ? "text-orange-700 bg-orange-50"
        : "text-on-surface-variant bg-surface-container-high";
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 relative overflow-hidden shadow-ambient">
      <div className={`absolute top-0 right-0 w-full h-1 bg-gradient-to-r ${accentBar}`} />
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Icon name={icon} className="text-6xl text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
        {label}
      </h3>
      <p className="text-5xl font-extrabold tracking-tighter mb-4">{value}</p>
      <div className={`flex items-center text-sm font-medium gap-1 w-fit px-2 py-1 rounded-full ${chip}`}>
        <Icon name="schedule" className="text-[14px]" />
        <span>{footer}</span>
      </div>
    </div>
  );
}
