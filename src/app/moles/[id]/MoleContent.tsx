"use client";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { DeleteButton } from "./DeleteButton";
import { useI18n } from "@/lib/i18n/context";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Scan } from "@/lib/types";
import { getZoneDisplayLabel } from "@/lib/zoneDetails";

function nextScanDate(createdAt: string, level: "low" | "medium" | "high", locale: string): string {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + (level === "high" ? 14 : 42));
  const loc = locale === "ru" ? "ru-RU" : locale === "kk" ? "kk-KZ" : "en-US";
  return d.toLocaleDateString(loc, { month: "short", day: "numeric", year: "numeric" });
}

type Props = {
  scan: Scan;
  sameArea: Scan[];
  latestUrl: string | null;
  baselineUrl: string | null;
};

// ── Health Score SVG Gauge ─────────────────────────────────────────────────
function ScoreGauge({ score, level }: { score: number; level: "low" | "medium" | "high" }) {
  const arcLen = 2 * Math.PI * 54 * 0.75; // 270° arc of r=54
  const healthScore = 100 - score; // invert: high risk = low health

  const trackColor = level === "high" ? "#ef4444" : level === "medium" ? "#f59e0b" : "#10b981";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="140" height="120" viewBox="0 0 140 120" className="-mb-2">
        <path
          d="M 14 105 A 54 54 0 1 1 126 105"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          className="text-surface-container-high"
        />
        <path
          d="M 14 105 A 54 54 0 1 1 126 105"
          fill="none"
          stroke={trackColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(arcLen * (score / 100)).toFixed(1)} ${arcLen}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="70" y="85" textAnchor="middle" className="fill-on-surface" fontSize="28" fontWeight="800">
          {healthScore}
        </text>
        <text x="70" y="100" textAnchor="middle" className="fill-on-surface-variant" fontSize="10">
          / 100
        </text>
      </svg>
    </div>
  );
}

// ── ABCDE Bar with color ───────────────────────────────────────────────────
function AbcdeBar({ label, desc, value }: { label: string; desc: string; value: number }) {
  const color =
    value >= 60 ? "bg-red-500"
    : value >= 35 ? "bg-amber-400"
    : "bg-emerald-500";

  return (
    <div className="flex items-center gap-3">
      <div className="w-7 text-center">
        <span className="text-xs font-black text-on-surface-variant uppercase">{label}</span>
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-on-surface-variant">{desc}</span>
          <span className="text-xs font-bold text-on-surface">{value}</span>
        </div>
        <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${color}`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function MoleContent({ scan, sameArea, latestUrl, baselineUrl }: Props) {
  const { t, locale } = useI18n();

  const riskBadge = {
    high:   "bg-red-500/90 text-white",
    medium: "bg-amber-400/90 text-black",
    low:    "bg-emerald-500/90 text-white",
  }[scan.risk_level];

  async function sharePdfReport() {
    // Try native share first; fall back to print-as-PDF
    const text = `SkinX — ${getZoneDisplayLabel(scan.body_area, locale) || t.moles.skinCheck}\n${t.riskLevels[scan.risk_level]} (${scan.risk_score}/100)\n\n${scan.summary ?? scan.notes}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "SkinX Scan Report", text }); return; } catch { /* fall through */ }
    }
    window.print();
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32 pt-16">
      {/* Print-only header */}
      <div className="print-only p-6 border-b border-gray-200 mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black">SkinX</h1>
          <p className="text-sm text-gray-500">{formatDate(scan.created_at)}</p>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">skinx.fit — {t.disclaimer.body1}</p>
      </div>
      <div className="no-print"><AppHeader back="/dashboard" /></div>
      <main className="pb-8 max-w-2xl mx-auto space-y-4">

        {/* ── Hero photo with risk badge + title overlay ── */}
        <section className="relative overflow-hidden">
          {latestUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={latestUrl} alt="scan" className="w-full h-64 object-cover" />
          ) : (
            <div className="w-full h-64 bg-surface-container-low flex items-center justify-center">
              <Icon name="image" className="text-6xl text-outline-variant" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          {/* Risk badge */}
          <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm ${riskBadge}`}>
            {t.riskLevels[scan.risk_level]}
          </div>

          {/* Title */}
          <div className="absolute bottom-0 left-0 p-5">
            <p className="text-white/60 text-[11px] font-semibold uppercase tracking-widest mb-0.5">
              {t.moles.spotTracker}
            </p>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              {getZoneDisplayLabel(scan.body_area, locale) || t.moles.skinCheck}
            </h1>
            <p className="text-white/60 text-xs mt-1">{formatDate(scan.created_at)}</p>
          </div>
        </section>

        <div className="px-4 space-y-4">

          {/* ── Health score gauge ── */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient flex flex-col items-center gap-1">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {t.moles.skinHealthScore}
            </p>
            <ScoreGauge score={scan.risk_score} level={scan.risk_level} />
          </section>

          {/* ── What This Means (AI Summary) ── */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name="psychology" filled className="text-primary text-base" />
              </div>
              <h2 className="text-base font-bold">{t.moles.whatThisMeans}</h2>
            </div>
            <p className="text-sm text-on-surface leading-relaxed">
              {scan.summary ?? scan.notes}
            </p>
            <p className="text-[10px] text-on-surface-variant italic">
              {t.moles.monitoringDisclaimer}
            </p>
          </section>

          {/* ── High-risk CTA ── */}
          {scan.risk_level === "high" && (
            <section className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                <Icon name="warning" filled className="text-red-500 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-700 dark:text-red-400 text-sm mb-1">
                  {t.moles.consultDerm}
                </h3>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed">
                  {t.moles.consultDermBody}
                </p>
              </div>
            </section>
          )}

          {/* ── ABCDE breakdown ── */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient space-y-4">
            <h2 className="text-base font-bold">{t.moles.abcdeMetrics}</h2>
            <div className="space-y-3">
              <AbcdeBar label="A" desc={t.moles.abcde.asymmetry} value={scan.abcde.asymmetry} />
              <AbcdeBar label="B" desc={t.moles.abcde.border}    value={scan.abcde.border} />
              <AbcdeBar label="C" desc={t.moles.abcde.color}     value={scan.abcde.color} />
              <AbcdeBar label="D" desc={t.moles.abcde.diameter}  value={scan.abcde.diameter} />
              <AbcdeBar label="E" desc={t.moles.abcde.evolution} value={scan.abcde.evolution} />
            </div>
          </section>

          {/* ── Photo comparison (only when >1 scan) ── */}
          {sameArea.length > 1 && (
            <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient space-y-4">
              <h2 className="text-base font-bold">{t.moles.evolution}</h2>
              <div className="flex gap-2">
                <div className="w-1/2 relative rounded-xl overflow-hidden">
                  {baselineUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={baselineUrl} alt="baseline" className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-surface-container-low flex items-center justify-center">
                      <Icon name="image" className="text-3xl text-outline-variant" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-bold text-white">
                    {formatDate(sameArea[sameArea.length - 1]?.created_at ?? scan.created_at)}
                  </div>
                  <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase">
                    {t.moles.baseline}
                  </div>
                </div>
                <div className="w-1/2 relative rounded-xl overflow-hidden">
                  {latestUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={latestUrl} alt="latest" className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-surface-container-low flex items-center justify-center">
                      <Icon name="image" className="text-3xl text-outline-variant" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-bold text-white">
                    {formatDate(scan.created_at)}
                  </div>
                  <div className="absolute top-2 right-2 bg-primary backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase">
                    {t.moles.latest}
                  </div>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant text-center">{t.moles.compareHint}</p>
            </section>
          )}

          {/* ── Scan history timeline ── */}
          {sameArea.length > 1 && (
            <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient space-y-4">
              <h2 className="text-base font-bold">{t.moles.scanHistory}</h2>
              <div className="relative border-l-2 border-surface-container-high space-y-6 pl-6 pb-2">
                {sameArea.map((s, i) => (
                  <div key={s.id} className="relative">
                    <div className={`absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-surface-container-lowest ${i === 0 ? "bg-primary" : "bg-surface-variant"}`} />
                    <h3 className="text-sm font-bold">
                      {i === 0 ? t.moles.latestScan : i === sameArea.length - 1 ? t.moles.initialBaseline : t.moles.routineCheck}
                    </h3>
                    <p className="text-xs text-on-surface-variant">{formatDateTime(s.created_at)}</p>
                    {s.notes && <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{s.notes}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Next scan date ── */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name="calendar_month" filled className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">{t.moles.nextScan}</p>
                <p className="text-xs text-on-surface-variant">
                  {nextScanDate(scan.created_at, scan.risk_level, locale)}
                  {" · "}
                  {scan.risk_level === "high" ? t.moles.inTwoWeeks : t.moles.inSixWeeks}
                </p>
              </div>
            </div>
          </section>

          {/* ── Actions ── */}
          <section className="space-y-3 pt-1 no-print">
            <div className="flex gap-3">
              <Link
                href="/scan"
                className="flex-1 bg-primary-gradient text-on-primary font-bold rounded-2xl px-4 py-4 shadow-primary-glow active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Icon name="add_a_photo" />
                {t.moles.newScan}
              </Link>
              <button
                onClick={sharePdfReport}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-surface-container font-bold text-sm active:scale-95 transition-all"
              >
                <Icon name="picture_as_pdf" />
                {t.moles.sharePdfReport}
              </button>
            </div>
            <DeleteButton id={scan.id} fullWidth />
          </section>

        </div>
      </main>
      <div className="no-print"><BottomNav /></div>
    </div>
  );
}
