"use client";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/context";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Scan } from "@/lib/types";
import { getZoneDisplayLabel } from "@/lib/zoneDetails";

type Props = {
  scans: Scan[];
  thumbs: (string | null)[];
};

const RISK_COLOR: Record<string, string> = {
  low: "bg-tertiary-container text-on-tertiary-container",
  medium: "bg-primary-container text-on-primary-container",
  high: "bg-error-container text-on-error-container",
};

export function MolesContent({ scans, thumbs }: Props) {
  const { t, locale } = useI18n();

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32" style={{ paddingTop: "calc(5rem + env(safe-area-inset-top))" }}>
      <AppHeader />
      <main className="max-w-md mx-auto px-5 space-y-4">
        <section className="pt-4 pb-2">
          <h1 className="text-2xl font-extrabold tracking-tight">{t.nav.log}</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">{t.dashboard.yourSkinCards}</p>
        </section>

        {scans.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-10 text-center shadow-ambient">
            <Icon name="image_search" className="text-5xl text-outline-variant" />
            <h3 className="font-bold text-on-surface text-lg mt-3">{t.home.noScans}</h3>
            <p className="text-on-surface-variant text-sm mt-1">{t.home.noScansHint}</p>
            <Link
              href="/scan"
              className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-gradient text-on-primary font-semibold text-sm shadow-primary-glow"
            >
              <Icon name="add_a_photo" className="text-[18px]" />
              {t.home.startScan}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((s, i) => (
              <Link
                key={s.id}
                href={`/moles/${s.id}`}
                className="flex gap-4 bg-surface-container-lowest rounded-2xl p-4 shadow-ambient active:scale-[0.98] transition-transform"
              >
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-surface-container-low shrink-0">
                  {thumbs[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbs[i] as string}
                      alt={getZoneDisplayLabel(s.body_area, locale) || t.home.skinCheck}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="image" className="text-3xl text-outline-variant" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-on-surface text-base leading-tight truncate">
                      {getZoneDisplayLabel(s.body_area, locale) || t.home.skinCheck}
                    </h3>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0",
                        RISK_COLOR[s.risk_level] ?? RISK_COLOR.low,
                      )}
                    >
                      {t.riskLevels[s.risk_level]}
                    </span>
                  </div>
                  <div className="flex items-center text-on-surface-variant text-xs gap-1 mt-1.5">
                    <Icon name="calendar_today" className="text-[13px]" />
                    <span>{formatDateTime(s.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="h-1.5 flex-1 rounded-full bg-surface-container overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary-gradient"
                        style={{ width: `${100 - s.risk_score}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-primary ml-1">
                      {100 - s.risk_score}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
