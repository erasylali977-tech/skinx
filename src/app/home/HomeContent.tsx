"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { useI18n } from "@/lib/i18n/context";
import { formatDateTime } from "@/lib/utils";
import { getZoneDisplayLabel } from "@/lib/zoneDetails";
import type { Scan } from "@/lib/types";

type Props = {
  firstName: string;
  scans: Scan[];
  thumbs: (string | null)[];
};

const GREETINGS = {
  en: { morning: "Good morning",  afternoon: "Good afternoon",  evening: "Good evening",  night: "Good night"   },
  ru: { morning: "Доброе утро",   afternoon: "Добрый день",     evening: "Добрый вечер",  night: "Доброй ночи"  },
  kk: { morning: "Қайырлы таң",  afternoon: "Қайырлы күн",    evening: "Қайырлы кеш",  night: "Қайырлы түн"  },
};

function getTimeGreeting(loc: string, h: number): string {
  const g = GREETINGS[loc as keyof typeof GREETINGS] ?? GREETINGS.en;
  if (h >= 5  && h < 12) return g.morning;
  if (h >= 12 && h < 17) return g.afternoon;
  if (h >= 17 && h < 22) return g.evening;
  return g.night;
}

const RISK_COLORS = {
  low:    { bg: "bg-emerald-500/15", text: "text-emerald-500", dot: "bg-emerald-500",  label: { ru: "Низкий",   en: "Low",    kk: "Төмен" } },
  medium: { bg: "bg-amber-400/15",   text: "text-amber-500",   dot: "bg-amber-400",   label: { ru: "Средний",  en: "Medium", kk: "Орта" } },
  high:   { bg: "bg-red-500/15",     text: "text-red-500",     dot: "bg-red-500",     label: { ru: "Высокий",  en: "High",   kk: "Жоғары" } },
};

export function HomeContent({ firstName, scans, thumbs }: Props) {
  const { t, locale } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [timeGreeting, setTimeGreeting] = useState("");
  useEffect(() => {
    setMounted(true);
    setTimeGreeting(getTimeGreeting(locale, new Date().getHours()));
  }, [locale]);

  const lastScan   = scans[0];
  const totalScans = scans.length;
  const lastRC     = lastScan ? RISK_COLORS[lastScan.risk_level] : null;

  return (
    <div className="min-h-screen bg-background text-on-surface pb-28">
      <DisclaimerModal />

      {/* ── Slim top bar ── */}
      <header className="fixed top-0 left-0 w-full z-40 bg-background/80 backdrop-blur-xl" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center justify-between px-5 py-3 max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <Icon name="spa" filled className="text-primary text-xl" />
            <span className="font-black text-base tracking-tight">SkinX</span>
          </div>
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center"
              >
                <Icon name={resolvedTheme === "dark" ? "light_mode" : "dark_mode"} className="text-on-surface-variant text-[18px]" />
              </button>
            )}
            <Link href="/account" className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center">
              <Icon name="person" className="text-on-surface-variant text-[18px]" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto md:max-w-4xl" style={{ paddingTop: "calc(3.75rem + env(safe-area-inset-top))" }}>

        {/* ── Greeting ── */}
        <section className="px-5 pt-6 pb-5">
          <p className="text-on-surface-variant text-[17px] font-semibold mb-1">
            {timeGreeting}
          </p>
          <h1 className="text-[38px] leading-[1.1] font-black tracking-tight">
            {firstName} 👋
          </h1>
        </section>

        {/* ── PRIMARY SCAN CARD ── */}
        <section className="px-4 mb-4">
          <Link
            href="/scan"
            className="relative w-full rounded-[24px] overflow-hidden flex flex-col justify-between active:scale-[0.98] transition-transform duration-200"
            style={{
              background: "linear-gradient(135deg, #3d7aed 0%, #2d62d4 100%)",
              boxShadow: "0 8px 32px rgba(61,122,237,0.30)",
              minHeight: "160px",
            }}
          >
            {/* Subtle blob */}
            <div className="absolute top-[-20px] right-[-20px] w-40 h-40 rounded-full bg-white/8 blur-2xl pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 px-5 py-5 flex items-center justify-between h-full">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="text-white/70 text-[11px] font-semibold uppercase tracking-widest">Gemini AI</span>
                </div>
                <p className="text-white text-[20px] font-black leading-tight tracking-tight mb-4">
                  {t.home.heroSubtitle}
                </p>
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2.5">
                  <Icon name="document_scanner" className="text-white text-sm" />
                  <span className="text-white text-sm font-bold">{t.home.heroTitle}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ml-4 flex-shrink-0">
                <Icon name="arrow_forward" className="text-white text-base" />
              </div>
            </div>
          </Link>
        </section>

        {/* ── Stats chips row (only if scans exist) ── */}
        {totalScans > 0 && lastScan && lastRC && (
          <section className="px-4 mb-6">
            <div className="grid grid-cols-3 gap-2.5">
              {/* Total */}
              <div className="bg-surface-container rounded-2xl px-3 py-3 flex flex-col gap-1">
                <span className="text-on-surface-variant text-[10px] font-semibold uppercase tracking-wide">
                  {locale === "ru" ? "Сканов" : locale === "kk" ? "Скан" : "Scans"}
                </span>
                <span className="text-on-surface text-xl font-black">{totalScans}</span>
              </div>
              {/* Last date */}
              <div className="bg-surface-container rounded-2xl px-3 py-3 flex flex-col gap-1">
                <span className="text-on-surface-variant text-[10px] font-semibold uppercase tracking-wide">
                  {locale === "ru" ? "Последний" : locale === "kk" ? "Соңғы" : "Last"}
                </span>
                <span className="text-on-surface text-xs font-bold leading-tight mt-0.5">
                  {formatDateTime(lastScan.created_at)}
                </span>
              </div>
              {/* Risk */}
              <div className={`rounded-2xl px-3 py-3 flex flex-col gap-1 ${lastRC.bg}`}>
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${lastRC.text}`}>
                  {locale === "ru" ? "Риск" : locale === "kk" ? "Қауіп" : "Risk"}
                </span>
                <span className={`text-sm font-black ${lastRC.text}`}>
                  {lastRC.label[locale as "ru" | "en" | "kk"]}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ── Recent Scans ── */}
        <section className="px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[17px] font-black tracking-tight">{t.home.recentScans}</h2>
            <Link href="/moles" className="text-primary font-semibold text-sm flex items-center gap-0.5">
              {t.common.seeAll}
              <Icon name="chevron_right" className="text-sm" />
            </Link>
          </div>

          {scans.length === 0 ? (
            <div className="bg-surface-container rounded-3xl p-7 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-3">
                <Icon name="image_search" className="text-2xl text-outline-variant" />
              </div>
              <h3 className="font-bold text-on-surface text-sm mb-1">{t.home.noScans}</h3>
              <p className="text-on-surface-variant text-xs">{t.home.noScansHint}</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-3 pb-4 hide-scrollbar -mx-4 px-4 snap-x">
              {scans.map((s, i) => {
                const rc = RISK_COLORS[s.risk_level];
                return (
                  <Link
                    key={s.id}
                    href={`/moles/${s.id}`}
                    className="min-w-[200px] bg-surface-container rounded-3xl overflow-hidden snap-center active:scale-[0.97] transition-transform duration-150 flex flex-col"
                  >
                    <div className="relative w-full h-[120px] bg-surface-container-high">
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
                      <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 ${rc.bg} backdrop-blur-sm px-2 py-0.5 rounded-full`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                        <span className={`text-[10px] font-bold ${rc.text}`}>{s.risk_score}</span>
                      </div>
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="font-bold text-on-surface text-xs leading-tight">
                        {getZoneDisplayLabel(s.body_area, locale) || t.home.skinCheck}
                      </p>
                      <p className="text-on-surface-variant text-[10px] mt-0.5">
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
