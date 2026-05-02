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

// ── Canvas helpers (client-side, results page) ──────────────────────────────────

// YCbCr skin detection (Kovac et al.) — filters out background, clothing, etc.
function isSkin(r: number, g: number, b: number): boolean {
  const cb = -0.169 * r - 0.331 * g + 0.500 * b + 128;
  const cr =  0.500 * r - 0.419 * g - 0.081 * b + 128;
  return cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173;
}

// Skin mean via YCbCr-detected pixels; falls back to center crop
function skinMean(px: Uint8ClampedArray, W: number, H: number): [number, number, number] {
  let rS = 0, gS = 0, bS = 0, ns = 0;
  for (let i = 0; i < W * H; i++) {
    const r = px[i*4], g = px[i*4+1], b = px[i*4+2];
    if (isSkin(r, g, b)) { rS += r; gS += g; bS += b; ns++; }
  }
  if (ns > W * H * 0.05) return [rS / ns, gS / ns, bS / ns];
  const sr = Math.floor(Math.min(W, H) * 0.15);
  const cx = Math.floor(W / 2), cy = Math.floor(H / 2);
  let rF = 0, gF = 0, bF = 0, n = 0;
  for (let y = cy - sr; y <= cy + sr; y++)
    for (let x = cx - sr; x <= cx + sr; x++) {
      if (x < 0 || x >= W || y < 0 || y >= H) continue;
      const i = (y * W + x) * 4;
      rF += px[i]; gF += px[i+1]; bF += px[i+2]; n++;
    }
  return n > 0 ? [rF / n, gF / n, bF / n] : [128, 100, 90];
}

// Green = healthy skin, Yellow/Orange = deviation, Red = high anomaly
function skinThermalColor(t: number): [number, number, number] {
  const v = Math.max(0, Math.min(1, t));
  if (v < 0.5) return [Math.round(v * 2 * 255), 255, 0];
  const s = (v - 0.5) * 2;
  return [255, Math.round((1 - s) * 255), 0];
}

function boxBlur(src: Float32Array, W: number, H: number, r: number): Float32Array {
  const tmp = new Float32Array(W * H);
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    let sum = 0;
    for (let x = 0; x < Math.min(r, W); x++) sum += src[y * W + x];
    for (let x = 0; x < W; x++) {
      if (x + r < W) sum += src[y * W + x + r];
      if (x - r - 1 >= 0) sum -= src[y * W + x - r - 1];
      tmp[y * W + x] = sum / (Math.min(x + r + 1, W) - Math.max(0, x - r));
    }
  }
  for (let x = 0; x < W; x++) {
    let sum = 0;
    for (let y = 0; y < Math.min(r, H); y++) sum += tmp[y * W + x];
    for (let y = 0; y < H; y++) {
      if (y + r < H) sum += tmp[(y + r) * W + x];
      if (y - r - 1 >= 0) sum -= tmp[(y - r - 1) * W + x];
      out[y * W + x] = sum / (Math.min(y + r + 1, H) - Math.max(0, y - r));
    }
  }
  return out;
}

// Skin-anomaly thermal: YCbCr mask → skin only → chromatic deviation → green→red
function generateHeatmapUrl(img: HTMLImageElement): string {
  const MAX = 400;
  const scale = Math.min(1, MAX / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const W = Math.max(1, Math.round((img.naturalWidth  || MAX) * scale));
  const H = Math.max(1, Math.round((img.naturalHeight || MAX) * scale));
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, W, H);
  const id = ctx.getImageData(0, 0, W, H);
  const px = id.data;
  const [mr, mg, mb] = skinMean(px, W, H);

  const anom = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const dr = px[i*4]-mr, dg = px[i*4+1]-mg, db = px[i*4+2]-mb;
    anom[i] = Math.sqrt(dr*dr + dg*dg + db*db);
  }
  const blurred = boxBlur(anom, W, H, Math.max(2, Math.floor(Math.min(W, H) * 0.04)));
  const sorted  = Float32Array.from(blurred).sort();
  const p95     = sorted[Math.floor(sorted.length * 0.95)] || 1;

  for (let i = 0; i < W * H; i++) {
    const r = px[i*4], g = px[i*4+1], b = px[i*4+2];
    const o = i * 4;
    if (!isSkin(r, g, b)) {
      const gray = Math.round((0.299 * r + 0.587 * g + 0.114 * b) * 0.38);
      id.data[o] = gray; id.data[o+1] = gray; id.data[o+2] = gray;
    } else {
      const t = Math.min(1, blurred[i] / p95);
      const [tr, tg, tb] = skinThermalColor(t);
      id.data[o]   = Math.round(tr * 0.7 + r * 0.3);
      id.data[o+1] = Math.round(tg * 0.7 + g * 0.3);
      id.data[o+2] = Math.round(tb * 0.7 + b * 0.3);
    }
  }
  ctx.putImageData(id, 0, 0);
  return c.toDataURL("image/jpeg", 0.88);
}

// AI detection overlay: uses Gemini bbox when available, else heuristic anomaly cluster
function generateSegmentUrl(img: HTMLImageElement, primaryDx?: string, bbox?: { x: number; y: number; w: number; h: number } | null): string {
  const MAX = 400;
  const scale = Math.min(1, MAX / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const W = Math.max(1, Math.round((img.naturalWidth  || MAX) * scale));
  const H = Math.max(1, Math.round((img.naturalHeight || MAX) * scale));
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, W, H);
  const id = ctx.getImageData(0, 0, W, H);
  const px = id.data;
  const [mr, mg, mb] = skinMean(px, W, H);

  const anom = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const dr = px[i*4]-mr, dg = px[i*4+1]-mg, db = px[i*4+2]-mb;
    anom[i] = Math.sqrt(dr*dr + dg*dg + db*db);
  }

  let bx: number, by: number, bw: number, bh: number;

  if (bbox) {
    // Real Gemini bbox (normalized 0-1 → pixel coords)
    bx = Math.max(0, Math.round(bbox.x * W));
    by = Math.max(0, Math.round(bbox.y * H));
    bw = Math.min(W - bx, Math.max(8, Math.round(bbox.w * W)));
    bh = Math.min(H - by, Math.max(8, Math.round(bbox.h * H)));
  } else {
    // Heuristic fallback: peak-anchored bbox from hottest anomaly spot
    const blurredH = boxBlur(anom, W, H, Math.max(2, Math.floor(Math.min(W, H) * 0.04)));
    let peakVal = 0, peakX = 0, peakY = 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (blurredH[y * W + x] > peakVal) { peakVal = blurredH[y * W + x]; peakX = x; peakY = y; }
    if (!peakVal) { ctx.putImageData(id, 0, 0); return c.toDataURL("image/jpeg", 0.88); }
    const thresh = peakVal * 0.35;
    const maxR2 = Math.pow(Math.min(W, H) * 0.40, 2);
    let x0 = peakX, x1 = peakX, y0 = peakY, y1 = peakY;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const dx = x - peakX, dy = y - peakY;
        if (blurredH[y * W + x] >= thresh && dx * dx + dy * dy <= maxR2) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    const pad = Math.round(Math.min(W, H) * 0.05);
    bx = Math.max(0, x0 - pad); by = Math.max(0, y0 - pad);
    bw = Math.min(W - bx, x1 - x0 + pad * 2); bh = Math.min(H - by, y1 - y0 + pad * 2);
  }

  // Dim outside bbox
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (!(x >= bx && x <= bx+bw && y >= by && y <= by+bh)) {
        const i = (y*W+x)*4;
        id.data[i] = Math.round(px[i]*0.45); id.data[i+1] = Math.round(px[i+1]*0.45); id.data[i+2] = Math.round(px[i+2]*0.45);
      }
  ctx.putImageData(id, 0, 0);

  // Glowing bbox
  ctx.save();
  ctx.shadowColor = "rgba(77,157,255,0.85)"; ctx.shadowBlur = 16;
  ctx.strokeStyle = "rgba(77,157,255,0.95)"; ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.restore();

  // Corner ticks
  const tc = 12;
  ctx.strokeStyle = "rgba(255,255,255,0.92)"; ctx.lineWidth = 2.5; ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(bx, by+tc);       ctx.lineTo(bx, by);       ctx.lineTo(bx+tc, by);
  ctx.moveTo(bx+bw-tc, by);    ctx.lineTo(bx+bw, by);    ctx.lineTo(bx+bw, by+tc);
  ctx.moveTo(bx, by+bh-tc);    ctx.lineTo(bx, by+bh);    ctx.lineTo(bx+tc, by+bh);
  ctx.moveTo(bx+bw-tc, by+bh); ctx.lineTo(bx+bw, by+bh); ctx.lineTo(bx+bw, by+bh-tc);
  ctx.stroke();

  // Diagnosis label pill
  if (primaryDx) {
    ctx.font = "bold 11px system-ui, sans-serif";
    const tw = ctx.measureText(primaryDx).width + 14;
    const lx = Math.min(bx, W - tw - 2), ly = Math.max(2, by - 22);
    ctx.fillStyle = "rgba(61,122,237,0.92)";
    ctx.beginPath(); ctx.roundRect(lx, ly, tw, 19, 4); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(primaryDx, lx + 7, ly + 13);
  }

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

const ABCDE_LABELS: Record<string, string> = {
  asymmetry: "Асимметрия",
  border:    "Контур краёв",
  color:     "Цвет",
  diameter:  "Диаметр",
  evolution: "Динамика",
};

// ── Hero Carousel: Original → Heatmap → Segmentation ────────────────────────
function HeroCarousel({
  imageUrl, riskBadge, riskLevelLabel, zoneLabel, date, primaryDx, lesionBbox, abcde,
}: {
  imageUrl: string | null;
  riskBadge: string;
  riskLevelLabel: string;
  zoneLabel: string;
  date: string;
  primaryDx?: string;
  lesionBbox?: { x: number; y: number; w: number; h: number } | null;
  abcde?: { asymmetry: number; border: number; color: number; diameter: number; evolution: number };
}) {
  const { t } = useI18n();
  const [slide, setSlide] = useState(0);
  const [heatUrl, setHeatUrl] = useState<string | null>(null);
  const [segUrl,  setSegUrl]  = useState<string | null>(null);
  const startX = useRef(0);

  // Top ABCDE concern factor for thermal subtitle
  const topFactor = abcde
    ? (Object.entries(abcde).sort(([, a], [, b]) => (b as number) - (a as number))[0])
    : null;
  const topFactorLabel = topFactor ? ABCDE_LABELS[topFactor[0]] : null;

  useEffect(() => {
    if (!imageUrl) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setHeatUrl(generateHeatmapUrl(img));
      setSegUrl(generateSegmentUrl(img, primaryDx, lesionBbox));
    };
    img.src = imageUrl;
  }, [imageUrl, primaryDx, lesionBbox]);

  const slides = [
    { url: imageUrl, badge: "ОРИГИНАЛ",    sub: "исходное фото" },
    { url: heatUrl,  badge: "ТЕПЛОВИЗОР",  sub: topFactorLabel ? `${topFactorLabel} · YCbCr` : "YCbCr · кожа" },
    { url: segUrl,   badge: "AI АНАЛИЗ",    sub: primaryDx ?? "область очага" },
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
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-xl z-10">
        <span className="text-white text-[10px] font-bold uppercase tracking-wider block leading-none">{current.badge}</span>
        <span className="text-white/55 text-[9px] font-medium block mt-0.5 leading-none">{current.sub}</span>
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
          primaryDx={scan.differential_diagnosis?.[0]?.name}
          lesionBbox={scan.lesion_bbox}
          abcde={scan.abcde}
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
