"use client";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n/context";
import { formatDateTime } from "@/lib/utils";
import { getZoneLabel } from "@/lib/bodyZones";
import type { Scan } from "@/lib/types";

type Props = {
  firstName: string;
  scans: Scan[];
  thumbs: (string | null)[];
};

export function HomeContent({ firstName, scans, thumbs }: Props) {
  const { t, locale } = useI18n();

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-28">
      <DisclaimerModal />
      <AppHeader />
      <main className="pt-24 px-6 max-w-md mx-auto md:max-w-4xl">
        <section className="mb-10">
          <h1 className="text-[32px] leading-tight font-extrabold tracking-tight mb-2">
            {t.home.greeting}, {firstName}
          </h1>
          <p className="text-on-surface-variant font-medium text-lg">
            {t.home.subtitle}
          </p>
        </section>

        <section className="mb-12">
          <Link
            href="/scan"
            className="relative w-full rounded-[24px] overflow-hidden flex flex-col justify-end min-h-[220px] active:scale-[0.98] transition-transform duration-200 shadow-ambient-xl"
          >
            <Image
              src="/scan-hero.jpeg"
              alt="Skin scanning"
              fill
              className="object-cover object-center"
              priority
            />
            {/* overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
            {/* content */}
            <div className="relative z-10 px-6 pb-6 pt-16">
              <h2 className="text-white text-xl font-bold leading-snug mb-1 drop-shadow-md">
                {t.home.heroTitle}
              </h2>
              <p
                className="text-white text-xs leading-relaxed mb-4 max-w-[260px]"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
              >
                {t.home.heroSubtitle}
              </p>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2">
                <Icon name="my_location" className="text-white text-base" />
                <span className="text-white text-sm font-semibold">{t.home.selectZoneBtn}</span>
              </div>
            </div>
          </Link>
        </section>

        <section>
          <div className="flex justify-between items-end mb-6 px-1">
            <h2 className="text-xl font-bold tracking-tight">{t.home.recentScans}</h2>
            <Link
              href="/dashboard"
              className="text-primary font-medium text-sm hover:opacity-70"
            >
              {t.common.seeAll}
            </Link>
          </div>
          {scans.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-[24px] p-8 text-center shadow-ambient">
              <Icon name="image_search" className="text-5xl text-outline-variant" />
              <h3 className="font-bold text-on-surface text-lg mt-3">
                {t.home.noScans}
              </h3>
              <p className="text-on-surface-variant text-sm mt-1">
                {t.home.noScansHint}
              </p>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-6 hide-scrollbar -mx-6 px-6 snap-x">
              {scans.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/moles/${s.id}`}
                  className="min-w-[280px] bg-surface-container-lowest rounded-[24px] p-4 snap-center shadow-ambient flex flex-col gap-4"
                >
                  <div className="relative w-full h-32 rounded-[16px] overflow-hidden bg-surface-container-low">
                    {thumbs[i] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbs[i] as string}
                        alt={getZoneLabel(s.body_area, locale) || t.home.skinCheck}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="image" className="text-4xl text-outline-variant" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-primary">
                      {t.home.score}: {100 - s.risk_score}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-lg mb-1">
                      {getZoneLabel(s.body_area, locale) || t.home.skinCheck}
                    </h3>
                    <div className="flex items-center text-on-surface-variant text-sm gap-1.5">
                      <Icon name="calendar_today" className="text-[16px]" />
                      <span>{formatDateTime(s.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
