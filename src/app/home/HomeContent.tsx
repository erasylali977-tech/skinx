"use client";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n/context";
import { formatDateTime } from "@/lib/utils";
import { getZoneDisplayLabel } from "@/lib/zoneDetails";
import type { Scan } from "@/lib/types";

type Props = {
  firstName: string;
  scans: Scan[];
  thumbs: (string | null)[];
};

const RISK_COLORS = {
  low:    { bg: "bg-emerald-500/15", text: "text-emerald-500", dot: "bg-emerald-500" },
  medium: { bg: "bg-amber-400/15",   text: "text-amber-500",   dot: "bg-amber-400"  },
  high:   { bg: "bg-red-500/15",     text: "text-red-500",     dot: "bg-red-500"    },
};

export function HomeContent({ firstName, scans, thumbs }: Props) {
  const { t, locale } = useI18n();

  return (
    <div className="min-h-screen bg-background text-on-surface pb-28">
      <DisclaimerModal />
      <AppHeader />

      <main className="pt-20 max-w-md mx-auto md:max-w-4xl">

        {/* ── Greeting ── */}
        <section className="px-6 pt-6 pb-8">
          <p className="text-on-surface-variant text-sm font-medium mb-1 uppercase tracking-widest">
            SkinX
          </p>
          <h1 className="text-[34px] leading-[1.1] font-black tracking-tight">
            {t.home.greeting},<br />{firstName}
          </h1>
          <p className="text-on-surface-variant mt-2 text-base">
            {t.home.subtitle}
          </p>
        </section>

        {/* ── Hero CTA ── */}
        <section className="px-4 mb-10">
          <Link
            href="/scan"
            className="relative w-full rounded-[28px] overflow-hidden flex flex-col justify-end min-h-[240px] active:scale-[0.98] transition-transform duration-200"
            style={{ boxShadow: "0 20px 60px rgba(61,122,237,0.25), 0 4px 20px rgba(0,0,0,0.15)" }}
          >
            <Image
              src="/scan-hero.jpeg"
              alt="Skin scanning"
              fill
              className="object-cover object-center"
              priority
            />
            {/* Gradient layers */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />

            {/* Top badge */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white text-[11px] font-semibold tracking-wide uppercase">AI Ready</span>
            </div>

            {/* Content */}
            <div className="relative z-10 px-6 pb-6">
              <h2 className="text-white text-2xl font-black leading-tight tracking-tight mb-1.5">
                {t.home.heroTitle}
              </h2>
              <p className="text-white/65 text-sm leading-relaxed mb-5 max-w-[260px]">
                {t.home.heroSubtitle}
              </p>

              {/* CTA button row */}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl px-4 py-3">
                  <Icon name="my_location" className="text-white text-base flex-shrink-0" />
                  <span className="text-white text-sm font-semibold">{t.home.selectZoneBtn}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Icon name="arrow_forward" className="text-white text-base" />
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* ── Recent Scans ── */}
        <section className="px-4">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-black tracking-tight">{t.home.recentScans}</h2>
            <Link
              href="/moles"
              className="text-primary font-semibold text-sm flex items-center gap-1"
            >
              {t.common.seeAll}
              <Icon name="chevron_right" className="text-sm" />
            </Link>
          </div>

          {scans.length === 0 ? (
            <div className="bg-surface-container rounded-3xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-4">
                <Icon name="image_search" className="text-3xl text-outline-variant" />
              </div>
              <h3 className="font-bold text-on-surface text-base mb-1">
                {t.home.noScans}
              </h3>
              <p className="text-on-surface-variant text-sm">
                {t.home.noScansHint}
              </p>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-3 pb-4 hide-scrollbar -mx-4 px-4 snap-x">
              {scans.map((s, i) => {
                const rc = RISK_COLORS[s.risk_level];
                return (
                  <Link
                    key={s.id}
                    href={`/moles/${s.id}`}
                    className="min-w-[220px] bg-surface-container rounded-3xl overflow-hidden snap-center active:scale-[0.97] transition-transform duration-150 flex flex-col"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                  >
                    {/* Photo */}
                    <div className="relative w-full h-[140px] bg-surface-container-high">
                      {thumbs[i] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbs[i] as string}
                          alt={getZoneDisplayLabel(s.body_area, locale) || t.home.skinCheck}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon name="image" className="text-4xl text-outline-variant" />
                        </div>
                      )}
                      {/* Risk pill */}
                      <div className={`absolute top-3 right-3 flex items-center gap-1.5 ${rc.bg} backdrop-blur-sm px-2.5 py-1 rounded-full`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${rc.text}`}>
                          {s.risk_score}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="px-4 py-3 flex flex-col gap-1">
                      <p className="font-bold text-on-surface text-sm leading-tight">
                        {getZoneDisplayLabel(s.body_area, locale) || t.home.skinCheck}
                      </p>
                      <p className="text-on-surface-variant text-xs">
                        {formatDateTime(s.created_at)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
