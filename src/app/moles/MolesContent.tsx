"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/context";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Scan } from "@/lib/types";
import { getZoneDisplayLabel } from "@/lib/zoneDetails";
import { trackEvent } from "@/lib/analytics";

type Props = {
  scans: Scan[];
  thumbs: (string | null)[];
};

const RISK_COLOR: Record<string, string> = {
  low:    "bg-tertiary-container text-on-tertiary-container",
  medium: "bg-primary-container text-on-primary-container",
  high:   "bg-error-container text-on-error-container",
};

const RISK_DOT: Record<string, string> = {
  low:    "bg-emerald-400",
  medium: "bg-amber-400",
  high:   "bg-red-400",
};

const DAY_LABELS = {
  en: ["Mo","Tu","We","Th","Fr","Sa","Su"],
  ru: ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"],
  kk: ["Дс","Сс","Ср","Бс","Жм","Сб","Жс"],
};

const MONTH_NAMES = {
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  ru: ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],
  kk: ["Қаңтар","Ақпан","Наурыз","Сәуір","Мамыр","Маусым","Шілде","Тамыз","Қыркүйек","Қазан","Қараша","Желтоқсан"],
};

function toYMD(dateStr: string) {
  return dateStr.slice(0, 10);
}

export function MolesContent({ scans, thumbs }: Props) {
  const { t, locale } = useI18n();
  const loc = locale as "en" | "ru" | "kk";

  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("moles_viewed", { scan_count: scans.length });
  }, [scans.length]);

  // Build a map: "YYYY-MM-DD" → Scan[]
  const scansByDate = new Map<string, Scan[]>();
  scans.forEach(s => {
    const d = toYMD(s.created_at);
    if (!scansByDate.has(d)) scansByDate.set(d, []);
    scansByDate.get(d)!.push(s);
  });

  // Calendar grid
  const firstDay = new Date(calYear, calMonth, 1);
  // Monday-based: 0=Mo, 6=Su
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = toYMD(now.toISOString());

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDate(null);
  }

  function handleDayClick(day: number) {
    const ymd = `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    setSelectedDate(prev => prev === ymd ? null : ymd);
  }

  // Scans to display
  const filteredScans: { scan: Scan; idx: number }[] = selectedDate
    ? (scansByDate.get(selectedDate) ?? []).map(s => ({ scan: s, idx: scans.indexOf(s) }))
    : scans.map((s, i) => ({ scan: s, idx: i }));

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32" style={{ paddingTop: "calc(5rem + env(safe-area-inset-top))" }}>
      <AppHeader />
      <main className="max-w-md mx-auto px-4 space-y-4">
        <section className="pt-4 pb-1">
          <h1 className="text-2xl font-extrabold tracking-tight">{t.nav.log}</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">{t.dashboard.yourSkinCards}</p>
        </section>

        {/* ── Calendar ── */}
        <section className="bg-surface-container rounded-3xl overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center active:scale-90 transition-transform"
            >
              <Icon name="chevron_left" className="text-on-surface-variant text-sm" />
            </button>
            <span className="font-bold text-on-surface text-sm">
              {MONTH_NAMES[loc][calMonth]} {calYear}
            </span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center active:scale-90 transition-transform"
            >
              <Icon name="chevron_right" className="text-on-surface-variant text-sm" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-2 pb-1">
            {DAY_LABELS[loc].map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-on-surface-variant/60 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 px-2 pb-3 gap-y-0.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const ymd = `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const dayScan = scansByDate.get(ymd);
              const isToday = ymd === today;
              const isSelected = ymd === selectedDate;
              const hasScans = !!dayScan?.length;
              const riskLevel = hasScans ? dayScan![0].risk_level : null;

              return (
                <button
                  key={ymd}
                  onClick={() => hasScans && handleDayClick(day)}
                  disabled={!hasScans}
                  className={cn(
                    "relative flex flex-col items-center justify-center h-9 rounded-xl transition-all",
                    isSelected && "bg-primary text-on-primary",
                    !isSelected && isToday && "ring-1 ring-primary/40",
                    !isSelected && hasScans && "bg-surface-container-high cursor-pointer active:scale-95",
                    !hasScans && "opacity-40 cursor-default",
                  )}
                >
                  <span className={cn(
                    "text-xs font-bold leading-none",
                    isSelected ? "text-on-primary" : isToday ? "text-primary" : "text-on-surface",
                  )}>
                    {day}
                  </span>
                  {hasScans && !isSelected && (
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full mt-0.5",
                      RISK_DOT[riskLevel ?? "low"]
                    )} />
                  )}
                  {hasScans && isSelected && (
                    <Icon name="check" className="text-on-primary text-[9px] mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected date label */}
          {selectedDate && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-outline-variant/20">
              <span className="text-xs text-on-surface-variant font-medium">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                  locale === "ru" ? "ru-RU" : locale === "kk" ? "kk-KZ" : "en-US",
                  { day: "numeric", month: "long" }
                )}
                {" · "}{filteredScans.length} {locale === "ru" ? "скан" : locale === "kk" ? "скан" : "scan"}{filteredScans.length !== 1 && locale === "en" ? "s" : ""}
              </span>
              <button onClick={() => setSelectedDate(null)} className="text-primary text-xs font-semibold">
                {locale === "ru" ? "Все" : locale === "kk" ? "Барлығы" : "All"}
              </button>
            </div>
          )}
        </section>

        {/* ── Scan list ── */}
        {filteredScans.length === 0 ? (
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
            {filteredScans.map(({ scan: s, idx: i }) => (
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
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0",
                      RISK_COLOR[s.risk_level] ?? RISK_COLOR.low,
                    )}>
                      {t.riskLevels[s.risk_level]}
                    </span>
                  </div>
                  <div className="flex items-center text-on-surface-variant text-xs gap-1 mt-1.5">
                    <Icon name="calendar_today" className="text-[13px]" />
                    <span>{formatDateTime(s.created_at, locale)}</span>
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
