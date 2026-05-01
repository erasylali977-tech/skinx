"use client";
import { useEffect, useRef, useState } from "react";
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

// ── Canvas helpers (client-side only, called inside useEffect) ─────────────────
function thermalColor(gray: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, gray / 255));
  let r = 0, g = 0, b = 0;
  if (t < 0.25)      { b = 1; g = t * 4; }
  else if (t < 0.5)  { g = 1; b = 1 - (t - 0.25) * 4; }
  else if (t < 0.75) { r = (t - 0.5) * 4; g = 1; }
  else               { r = 1; g = 1 - (t - 0.75) * 4; }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function generateHeatmapUrl(img: HTMLImageElement): string {
  const MAX = 400;
  const scale = Math.min(1, MAX / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const W = Math.round((img.naturalWidth || MAX) * scale);
  const H = Math.round((img.naturalHeight || MAX) * scale);
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, W, H);
  const id = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < id.data.length; i += 4) {
    const gray = 0.299 * id.data[i] + 0.587 * id.data[i + 1] + 0.114 * id.data[i + 2];
    const [r, g, b] = thermalColor(gray);
    id.data[i] = r; id.data[i + 1] = g; id.data[i + 2] = b;
  }
  ctx.putImageData(id, 0, 0);
  const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.7);
  grad.addColorStop(0, "rgba(0,0,20,0)");
  grad.addColorStop(0.6, "rgba(0,0,50,0.15)");
  grad.addColorStop(1, "rgba(0,0,110,0.8)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  return c.toDataURL("image/jpeg", 0.88);
}

function generateSegmentUrl(img: HTMLImageElement): string {
  const MAX = 400;
  const scale = Math.min(1, MAX / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const W = Math.round((img.naturalWidth || MAX) * scale);
  const H = Math.round((img.naturalHeight || MAX) * scale);
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000a18";
  ctx.fillRect(0, 0, W, H);
  const rx = W * 0.43, ry = H * 0.42, cx = W / 2, cy = H / 2;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, 0, 0, W, H);
  ctx.restore();
  const grad = ctx.createRadialGradient(cx, cy, Math.min(rx, ry) * 0.45, cx, cy, Math.max(rx, ry) * 1.05);
  grad.addColorStop(0, "rgba(0,10,24,0)");
  grad.addColorStop(0.7, "rgba(0,10,24,0.15)");
  grad.addColorStop(0.9, "rgba(0,10,24,0.85)");
  grad.addColorStop(1, "rgba(0,10,24,1)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.87, ry * 0.87, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(100,210,255,0.65)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.restore();
  return c.toDataURL("image/jpeg", 0.88);
}

type Props = {
  scan: Scan;
  sameArea: Scan[];
  latestUrl: string | null;
  baselineUrl: string | null;
};

// ── Semicircle speedometer gauge (Skinive-style) ────────────────────────────
function SemicircleGauge({ score, level }: { score: number; level: "low" | "medium" | "high" }) {
  const [displayScore, setDisplayScore] = useState(0);
  const healthScore = 100 - score;
  const color = level === "high" ? "#ef4444" : level === "medium" ? "#f59e0b" : "#10b981";

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const DURATION = 1000;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(eased * healthScore));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [healthScore]);

  // Needle: center (100,100), length 74px
  // displayScore 0 → points left (-180°), 100 → points right (0°)
  const angleDeg = (displayScore / 100) * 180 - 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const nx = (100 + 74 * Math.cos(angleRad)).toFixed(1);
  const ny = (100 + 74 * Math.sin(angleRad)).toFixed(1);

  return (
    <div className="flex flex-col items-center">
      <svg width="210" height="115" viewBox="0 0 200 110" aria-hidden>
        <defs>
          <linearGradient id="sg-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#ef4444" />
            <stop offset="45%"  stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="14" strokeLinecap="round" />
        {/* Colored arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none" stroke="url(#sg-grad)" strokeWidth="14" strokeLinecap="round" />
        {/* Needle */}
        <line x1="100" y1="100" x2={nx} y2={ny}
          stroke={color} strokeWidth="3" strokeLinecap="round" />
        {/* Pivot */}
        <circle cx="100" cy="100" r="5" fill={color} />
      </svg>

      <div className="flex items-baseline gap-1 -mt-2">
        <span className="text-5xl font-black tabular-nums" style={{ color }}>{displayScore}</span>
        <span className="text-xl font-bold text-on-surface-variant">/100</span>
      </div>
      <div className="flex justify-between w-48 mt-1">
        <span className="text-[10px] font-semibold text-on-surface-variant">Риск</span>
        <span className="text-[10px] font-semibold text-on-surface-variant">Норма</span>
      </div>
    </div>
  );
}

// ── Hero Carousel: Original → Heatmap → Segmentation ────────────────────────
function HeroCarousel({
  imageUrl, riskBadge, riskLevelLabel, zoneLabel, date,
}: {
  imageUrl: string | null;
  riskBadge: string;
  riskLevelLabel: string;
  zoneLabel: string;
  date: string;
}) {
  const { t } = useI18n();
  const [slide, setSlide] = useState(0);
  const [heatUrl, setHeatUrl] = useState<string | null>(null);
  const [segUrl,  setSegUrl]  = useState<string | null>(null);
  const startX = useRef(0);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setHeatUrl(generateHeatmapUrl(img));
      setSegUrl(generateSegmentUrl(img));
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const slides = [
    { url: imageUrl, badge: "ORIGINAL" },
    { url: heatUrl,  badge: "THERMAL"  },
    { url: segUrl,   badge: "SEGMENT"  },
  ];

  const current = slides[slide];

  return (
    <section
      className="relative overflow-hidden"
      onTouchStart={e => { startX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - startX.current;
        if (dx < -50 && slide < 2) setSlide(s => s + 1);
        if (dx >  50 && slide > 0) setSlide(s => s - 1);
      }}
    >
      {current.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide}
          src={current.url}
          alt="scan"
          className="w-full h-72 object-cover"
          style={{ animation: "fadeIn 0.5s ease" }}
        />
      ) : (
        <div className="w-full h-72 bg-[#000a18] flex items-center justify-center">
          {imageUrl
            ? <span className="w-7 h-7 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            : <Icon name="image" className="text-6xl text-outline-variant" />}
        </div>
      )}

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

      {/* Slide type badge */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
        <span className="text-white text-[10px] font-bold uppercase tracking-wider">{current.badge}</span>
      </div>

      {/* Risk badge */}
      <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm z-10 ${riskBadge}`}>
        {riskLevelLabel}
      </div>

      {/* Title overlay */}
      <div className="absolute left-0 p-5 z-10" style={{ bottom: "40px" }}>
        <p className="text-white/60 text-[11px] font-semibold uppercase tracking-widest mb-0.5">
          {t.moles.spotTracker}
        </p>
        <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">{zoneLabel}</h1>
        <p className="text-white/60 text-xs mt-1">{date}</p>
      </div>

      {/* Slide indicator dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`h-2 rounded-full transition-all duration-200 ${
              i === slide ? "bg-white w-5" : "bg-white/40 w-2"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

// ── ABCDE Bar with color ───────────────────────────────────────────
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
    const el = document.getElementById("skinx-pdf-preview");
    if (!el) return;
    el.style.display = "block";
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      if (imgH <= pageH) {
        doc.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, imgW, imgH);
      } else {
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        const slicePx = Math.floor((pageH * canvas.width) / imgW);
        let pos = 0;
        while (pos < canvas.height) {
          const h = Math.min(slicePx, canvas.height - pos);
          sliceCanvas.height = h;
          sliceCanvas.getContext("2d")!.drawImage(canvas, 0, pos, canvas.width, h, 0, 0, canvas.width, h);
          if (pos > 0) doc.addPage();
          doc.addImage(sliceCanvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, imgW, (h * imgW) / canvas.width);
          pos += h;
        }
      }
      const blob = doc.output("blob");
      const zone = getZoneDisplayLabel(scan.body_area, locale) || t.moles.skinCheck;
      const fileName = `skinx-${zone.toLowerCase().replace(/\s+/g, "-")}-${scan.id.slice(0, 6)}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: "SkinX Report" }); return; } catch { /* fall through */ }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } finally {
      el.style.display = "none";
    }
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

        {/* ── Hero carousel: Original / Thermal / Segment ── */}
        <HeroCarousel
          imageUrl={latestUrl}
          riskBadge={riskBadge}
          riskLevelLabel={t.riskLevels[scan.risk_level]}
          zoneLabel={getZoneDisplayLabel(scan.body_area, locale) || t.moles.skinCheck}
          date={formatDate(scan.created_at)}
        />

        <div className="px-4 space-y-4">

          {/* ── Health score gauge (semicircle speedometer) ── */}
          <section className="bg-surface-container-lowest rounded-2xl px-5 pt-4 pb-5 shadow-ambient">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
              {t.moles.skinHealthScore}
            </p>
            <SemicircleGauge score={scan.risk_score} level={scan.risk_level} />
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

          {/* ── Differential Diagnosis ── */}
          {scan.differential_diagnosis && scan.differential_diagnosis.length > 0 && (
            <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="biotech" filled className="text-primary text-base" />
                </div>
                <h2 className="text-base font-bold">Дифф. диагностика</h2>
              </div>
              <div className="space-y-3">
                {scan.differential_diagnosis.map((item, i) => (
                  <div
                    key={item.name}
                    className={`rounded-xl p-3 ${
                      i === 0
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-surface-container"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex flex-col">
                        {i === 0 && (
                          <span className="text-primary text-[9px] font-bold uppercase tracking-wide mb-0.5">
                            ★ Основной диагноз
                          </span>
                        )}
                        <span className={`text-sm font-semibold ${
                          i === 0 ? "text-primary" : "text-on-surface"
                        }`}>
                          {item.name}
                        </span>
                      </div>
                      <span className={`text-base font-black tabular-nums ml-3 ${
                        i === 0 ? "text-primary" : "text-on-surface-variant"
                      }`}>
                        {item.probability}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          i === 0 ? "bg-primary" : "bg-surface-variant"
                        }`}
                        style={{ width: `${item.probability}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-on-surface-variant mt-3 italic leading-relaxed">
                Дифференциальный диагноз предоставлен только для информации. Необходима консультация дерматолога.
              </p>
            </section>
          )}

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

      {/* ── Hidden PDF preview (captured by html2canvas) ── */}
      <div
        id="skinx-pdf-preview"
        style={{ display: "none", position: "fixed", top: 0, left: 0, width: "794px", backgroundColor: "#fff", fontFamily: "Arial, sans-serif", color: "#1a1a1a", zIndex: -1 }}
      >
        {/* Header */}
        <div style={{ background: "#3d7aed", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#fff", fontSize: "28px", fontWeight: 900 }}>SkinX</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", marginTop: "2px" }}>Skin Health Report</div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>{formatDate(scan.created_at)}</div>
        </div>

        <div style={{ padding: "28px 32px" }}>
          {/* Zone + Score */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 800 }}>{getZoneDisplayLabel(scan.body_area, locale) || t.moles.skinCheck}</div>
              <div style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>{formatDate(scan.created_at)}</div>
            </div>
            <div style={{ background: scan.risk_level === "high" ? "#ef4444" : scan.risk_level === "medium" ? "#f59e0b" : "#10b981", color: "#fff", borderRadius: "12px", padding: "10px 20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 900 }}>{100 - scan.risk_score}<span style={{ fontSize: "14px", fontWeight: 600 }}>/100</span></div>
              <div style={{ fontSize: "10px", opacity: 0.85, marginTop: "2px" }}>{t.moles.skinHealthScore.toUpperCase()}</div>
            </div>
          </div>

          {/* Risk label */}
          <div style={{ background: "#f0f2fa", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: "14px" }}>{t.riskLevels[scan.risk_level]}</span>
            <span style={{ color: "#888", fontSize: "13px" }}>{t.moles.score}: {scan.risk_score}/100</span>
          </div>

          {/* AI Summary */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>{t.moles.whatThisMeans}</div>
            <div style={{ fontSize: "13px", color: "#444", lineHeight: 1.65 }}>{scan.summary ?? scan.notes ?? ""}</div>
          </div>

          {/* ABCDE */}
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "12px" }}>{t.moles.abcdeMetrics}</div>
            {([
              { l: "A", d: t.moles.abcde.asymmetry, v: scan.abcde.asymmetry },
              { l: "B", d: t.moles.abcde.border,    v: scan.abcde.border },
              { l: "C", d: t.moles.abcde.color,     v: scan.abcde.color },
              { l: "D", d: t.moles.abcde.diameter,  v: scan.abcde.diameter },
              { l: "E", d: t.moles.abcde.evolution, v: scan.abcde.evolution },
            ] as const).map(({ l, d, v }) => (
              <div key={l} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 700, color: "#666", minWidth: "16px" }}>{l}</span>
                  <span style={{ flex: 1, paddingLeft: "8px", fontSize: "12px", color: "#444" }}>{d}</span>
                  <span style={{ fontWeight: 700, fontSize: "12px" }}>{v}</span>
                </div>
                <div style={{ height: "6px", background: "#e5e5ea", borderRadius: "3px" }}>
                  <div style={{ height: "6px", background: v >= 60 ? "#ef4444" : v >= 35 ? "#f59e0b" : "#10b981", borderRadius: "3px", width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#f0f2fa", padding: "14px 32px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#999", fontSize: "11px", fontStyle: "italic" }}>{t.moles.monitoringDisclaimer}</span>
          <span style={{ color: "#888", fontWeight: 700, fontSize: "12px" }}>skinx.fit</span>
        </div>
      </div>
    </div>
  );
}
