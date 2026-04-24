"use client";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { DeleteButton } from "./DeleteButton";
import { useI18n } from "@/lib/i18n/context";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Scan } from "@/lib/types";

type Props = {
  scan: Scan;
  sameArea: Scan[];
  latestUrl: string | null;
  baselineUrl: string | null;
};

export function MoleContent({ scan, sameArea, latestUrl, baselineUrl }: Props) {
  const { t } = useI18n();

  function riskLabel(level: "low" | "medium" | "high") {
    return t.riskLevels[level];
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32 pt-24">
      <AppHeader back="/dashboard" />
      <main className="pt-4 pb-8 px-4 md:px-8 max-w-4xl mx-auto space-y-12">
        <section className="space-y-4">
          <div className="flex justify-between items-end gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-on-surface-variant uppercase mb-1">
                {t.moles.spotTracker}
              </p>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                {scan.body_area || t.moles.skinCheck}
              </h1>
            </div>
            <div
              className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                scan.risk_level === "high"
                  ? "bg-error-container text-on-error-container"
                  : scan.risk_level === "medium"
                    ? "bg-amber-100 text-amber-900"
                    : "bg-primary-container text-on-primary-container"
              }`}
            >
              {riskLabel(scan.risk_level)}
            </div>
          </div>
          <p className="text-on-surface-variant text-base leading-relaxed">
            {scan.notes}
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">{t.moles.evolution}</h2>
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
            <div className="flex gap-2 items-center justify-center relative">
              <div className="w-1/2 relative rounded-lg overflow-hidden">
                {baselineUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={baselineUrl}
                    alt="baseline"
                    className="w-full h-56 object-cover"
                  />
                ) : (
                  <div className="w-full h-56 bg-surface-container-low flex items-center justify-center">
                    <Icon name="image" className="text-4xl text-outline-variant" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                  {formatDate(sameArea[sameArea.length - 1]?.created_at ?? scan.created_at)}
                </div>
                <div className="absolute top-3 left-3 bg-primary/10 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-primary uppercase">
                  {t.moles.baseline}
                </div>
              </div>
              <div className="w-1/2 relative rounded-lg overflow-hidden">
                {latestUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={latestUrl}
                    alt="latest"
                    className="w-full h-56 object-cover"
                  />
                ) : (
                  <div className="w-full h-56 bg-surface-container-low flex items-center justify-center">
                    <Icon name="image" className="text-4xl text-outline-variant" />
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                  {formatDate(scan.created_at)}
                </div>
                <div className="absolute top-3 right-3 bg-primary text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                  {t.moles.latest}
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-on-surface-variant">
              <Icon name="touch_app" className="text-sm" />
              <p className="text-xs font-medium">
                {t.moles.compareHint}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">{t.moles.abcdeMetrics}</h2>
          <div className="bg-surface-container-lowest rounded-xl p-6 grid grid-cols-2 md:grid-cols-5 gap-6 shadow-ambient">
            {(
              [
                ["Asymmetry", scan.abcde.asymmetry],
                ["Border", scan.abcde.border],
                ["Color", scan.abcde.color],
                ["Diameter", scan.abcde.diameter],
                ["Evolution", scan.abcde.evolution],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <p className="text-sm font-semibold uppercase text-on-surface-variant tracking-wider mb-2">
                  {k}
                </p>
                <p className="text-3xl font-extrabold tracking-tighter mb-2">
                  {v}
                </p>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-gradient rounded-full"
                    style={{ width: `${v}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">{t.moles.scanHistory}</h2>
          <div className="bg-surface-container-lowest rounded-xl p-6 pl-8 shadow-ambient">
            <div className="relative border-l-2 border-surface-container-high space-y-8 pb-4">
              {sameArea.map((s, i) => (
                <div key={s.id} className="relative pl-8">
                  <div
                    className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ring-4 ring-surface-container-lowest ${i === 0 ? "bg-primary" : "bg-surface-variant"}`}
                  />
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">
                        {i === 0
                          ? t.moles.latestScan
                          : i === sameArea.length - 1
                            ? t.moles.initialBaseline
                            : t.moles.routineCheck}
                      </h3>
                      <p className="text-sm font-medium text-on-surface-variant">
                        {formatDateTime(s.created_at)}
                      </p>
                      <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                        {s.notes}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">{t.moles.aiInsights}</h2>
          <div className="bg-surface-container-lowest rounded-xl p-6 relative overflow-hidden shadow-ambient">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />
            <ul className="space-y-4 relative z-10">
              <Insight
                icon="verified"
                title={scan.risk_level === "low" ? t.moles.symmetryMaintained : t.moles.closerMonitoring}
                body={scan.risk_level === "low" ? t.moles.symmetryBody : t.moles.closerBody}
              />
              <Insight
                icon="wb_sunny"
                title={t.moles.sunRisk}
                body={t.moles.sunBody}
              />
              <Insight
                icon="calendar_month"
                title={t.moles.nextScan}
                body={scan.risk_level === "high" ? t.moles.nextHighBody : t.moles.nextLowBody}
              />
            </ul>
          </div>
        </section>

        <section className="pt-4 flex justify-between gap-3">
          <Link
            href="/scan"
            className="flex-1 bg-primary-gradient text-on-primary font-bold text-lg rounded-full px-8 py-4 shadow-primary-glow hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Icon name="add_a_photo" />
            {t.moles.newScan}
          </Link>
          <DeleteButton id={scan.id} />
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

function Insight({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <li className="flex items-start gap-3">
      <Icon name={icon} className="text-primary mt-0.5" />
      <div>
        <strong className="block text-on-surface font-semibold text-sm">
          {title}
        </strong>
        <span className="text-sm text-on-surface-variant">{body}</span>
      </div>
    </li>
  );
}
