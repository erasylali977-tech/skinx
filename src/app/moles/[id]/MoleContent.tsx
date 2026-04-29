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
      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
        Skin Health Score
      </p>
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
  const { t } = useI18n();

  const riskColors = {
    high:   { bg: "bg-red-50 dark:bg-red-950/30",    text: "text-red-600 dark:text-red-400",    border: "border-red-200 dark:border-red-800" },
    medium: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
    low:    { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
  };
  const rc = riskColors[scan.risk_level];

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32 pt-24">
      <AppHeader back="/dashboard" />
      <main className="pt-4 pb-8 px-4 md:px-8 max-w-2xl mx-auto space-y-6">

        {/* ── Hero: score gauge + risk badge ── */}
        <section className={`rounded-2xl p-6 border ${rc.border} ${rc.bg} flex flex-col items-center gap-4`}>
          <div className="w-full flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase mb-1">
                {t.moles.spotTracker}
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight leading-tight">
                {scan.body_area || t.moles.skinCheck}
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">{formatDate(scan.created_at)}</p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${rc.border} ${rc.text} ${rc.bg}`}>
              {t.riskLevels[scan.risk_level]}
            </span>
          </div>

          <ScoreGauge score={scan.risk_score} level={scan.risk_level} />
        </section>

        {/* ── AI Summary ── */}
        <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name="psychology" filled className="text-primary text-base" />
            </div>
            <h2 className="text-base font-bold">{t.moles.aiInsights}</h2>
          </div>
          <p className="text-sm text-on-surface leading-relaxed">
            {scan.summary ?? scan.notes}
          </p>
          <p className="text-[10px] text-on-surface-variant italic">
            For monitoring purposes only. Not a medical diagnosis.
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
                Consult a Dermatologist
              </h3>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed">
                This scan shows elevated indicators. We recommend scheduling a professional skin examination.
              </p>
            </div>
          </section>
        )}

        {/* ── ABCDE breakdown ── */}
        <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient space-y-4">
          <h2 className="text-base font-bold">{t.moles.abcdeMetrics}</h2>
          <div className="space-y-3">
            <AbcdeBar label="A" desc="Asymmetry"  value={scan.abcde.asymmetry} />
            <AbcdeBar label="B" desc="Border"     value={scan.abcde.border} />
            <AbcdeBar label="C" desc="Color"      value={scan.abcde.color} />
            <AbcdeBar label="D" desc="Diameter"   value={scan.abcde.diameter} />
            <AbcdeBar label="E" desc="Evolution"  value={scan.abcde.evolution} />
          </div>
        </section>

        {/* ── Photo comparison ── */}
        <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient space-y-4">
          <h2 className="text-base font-bold">{t.moles.evolution}</h2>
          <div className="flex gap-2">
            <div className="w-1/2 relative rounded-xl overflow-hidden">
              {baselineUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={baselineUrl} alt="baseline" className="w-full h-44 object-cover" />
              ) : (
                <div className="w-full h-44 bg-surface-container-low flex items-center justify-center">
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
                <img src={latestUrl} alt="latest" className="w-full h-44 object-cover" />
              ) : (
                <div className="w-full h-44 bg-surface-container-low flex items-center justify-center">
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

        {/* ── Scan history timeline ── */}
        <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient space-y-4">
          <h2 className="text-base font-bold">{t.moles.scanHistory}</h2>
          <div className="relative border-l-2 border-surface-container-high space-y-6 pl-6 pb-2">
            {sameArea.map((s, i) => (
              <div key={s.id} className="relative">
                <div
                  className={`absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-surface-container-lowest ${
                    i === 0 ? "bg-primary" : "bg-surface-variant"
                  }`}
                />
                <h3 className="text-sm font-bold">
                  {i === 0 ? t.moles.latestScan : i === sameArea.length - 1 ? t.moles.initialBaseline : t.moles.routineCheck}
                </h3>
                <p className="text-xs text-on-surface-variant">{formatDateTime(s.created_at)}</p>
                {s.notes && (
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{s.notes}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Next scan recommendation ── */}
        <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name="calendar_month" filled className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">{t.moles.nextScan}</p>
              <p className="text-xs text-on-surface-variant">
                {scan.risk_level === "high" ? t.moles.nextHighBody : t.moles.nextLowBody}
              </p>
            </div>
          </div>
        </section>

        {/* ── Actions ── */}
        <section className="flex gap-3 pt-2">
          <Link
            href="/scan"
            className="flex-1 bg-primary-gradient text-on-primary font-bold rounded-2xl px-6 py-4 shadow-primary-glow active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
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
