"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/context";
import { ScanCamera } from "./ScanCamera";
import { getZoneDisplayLabel } from "@/lib/zoneDetails";
import { BodyMapSVG } from "@/components/BodyMapSVG";
import { trackEvent } from "@/lib/analytics";

// ── Canvas helpers: skin-anomaly detection (shared with loading overlay) ───────

// YCbCr skin detection (Kovac et al.) — filters out background, clothing, etc.
function isSkin(r: number, g: number, b: number): boolean {
  const cb = -0.169 * r - 0.331 * g + 0.500 * b + 128;
  const cr =  0.500 * r - 0.419 * g - 0.081 * b + 128;
  return cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173;
}

// Skin mean using YCbCr-detected pixels; falls back to center crop
function skinMean(px: Uint8ClampedArray, W: number, H: number): [number, number, number] {
  let rS = 0, gS = 0, bS = 0, ns = 0;
  for (let i = 0; i < W * H; i++) {
    const r = px[i*4], g = px[i*4+1], b = px[i*4+2];
    if (isSkin(r, g, b)) { rS += r; gS += g; bS += b; ns++; }
  }
  if (ns > W * H * 0.05) return [rS / ns, gS / ns, bS / ns];
  // fallback: center 30% crop
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

// Green = normal skin, Yellow/Orange = deviation, Red = high anomaly
function skinThermalColor(t: number): [number, number, number] {
  const v = Math.max(0, Math.min(1, t));
  if (v < 0.5) return [Math.round(v * 2 * 255), 255, 0];
  const s = (v - 0.5) * 2;
  return [255, Math.round((1 - s) * 255), 0];
}

// Separable box blur on Float32Array
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

// Skin-anomaly heatmap: YCbCr skin mask → chromatic deviation → thermal
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
      // Non-skin (background, clothing) → dim gray
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

// Detection overlay: darkens background, draws bbox around top anomaly cluster
function generateSegmentUrl(img: HTMLImageElement): string {
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

  // Peak-anchored bbox: find hottest anomaly point, grow bbox to all pixels
  // above 35% of peak value within 40% image-radius — eliminates hair/reflection drift
  const blurred = boxBlur(anom, W, H, Math.max(2, Math.floor(Math.min(W, H) * 0.04)));
  let peakVal = 0, peakX = 0, peakY = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (blurred[y * W + x] > peakVal) { peakVal = blurred[y * W + x]; peakX = x; peakY = y; }
  if (!peakVal) return c.toDataURL("image/jpeg", 0.88);
  const thresh = peakVal * 0.35;
  const maxR2 = Math.pow(Math.min(W, H) * 0.40, 2);
  let x0 = peakX, x1 = peakX, y0 = peakY, y1 = peakY;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = x - peakX, dy = y - peakY;
      if (blurred[y * W + x] >= thresh && dx * dx + dy * dy <= maxR2) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }

  const pad = Math.round(Math.min(W, H) * 0.05);
  const bx = Math.max(0, x0 - pad), by = Math.max(0, y0 - pad);
  const bw = Math.min(W - bx, x1 - x0 + pad * 2), bh = Math.min(H - by, y1 - y0 + pad * 2);

  // Dim everything outside bbox
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!(x >= bx && x <= bx + bw && y >= by && y <= by + bh)) {
        const i = (y * W + x) * 4;
        id.data[i] = Math.round(px[i]*0.45); id.data[i+1] = Math.round(px[i+1]*0.45); id.data[i+2] = Math.round(px[i+2]*0.45);
      }
    }
  }
  ctx.putImageData(id, 0, 0);

  // Glowing bbox
  ctx.save();
  ctx.shadowColor = "rgba(77,157,255,0.8)"; ctx.shadowBlur = 14;
  ctx.strokeStyle = "rgba(77,157,255,0.95)"; ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.restore();

  // Corner ticks
  const tc = 10;
  ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(bx,      by + tc); ctx.lineTo(bx,      by);      ctx.lineTo(bx + tc,    by);
  ctx.moveTo(bx+bw-tc,by);      ctx.lineTo(bx+bw,   by);      ctx.lineTo(bx+bw,      by+tc);
  ctx.moveTo(bx,      by+bh-tc);ctx.lineTo(bx,      by+bh);   ctx.lineTo(bx+tc,      by+bh);
  ctx.moveTo(bx+bw-tc,by+bh);   ctx.lineTo(bx+bw,   by+bh);  ctx.lineTo(bx+bw,      by+bh-tc);
  ctx.stroke();

  return c.toDataURL("image/jpeg", 0.88);
}

// ── Analyzing overlay: 3-phase heatmap animation ───────────────────────────
function AnalyzingOverlay({ photoUrl }: { photoUrl: string | null }) {
  const { t } = useI18n();
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState(0); // 0=original 1=heatmap 2=segmentation
  const [heatUrl, setHeatUrl] = useState<string | null>(null);
  const [segUrl,  setSegUrl]  = useState<string | null>(null);

  const STEP_LABELS = [
    "Анализ текстуры и структуры...",
    "Оценка хроматических паттернов...",
    "Сегментация области поражения...",
    "Формирование диагноза и рекомендаций...",
  ];
  const currentStep = pct < 30 ? 0 : pct < 57 ? 1 : pct < 85 ? 2 : 3;

  // Generate heatmap + segmentation from photo
  useEffect(() => {
    if (!photoUrl) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setHeatUrl(generateHeatmapUrl(img));
      setSegUrl(generateSegmentUrl(img));
    };
    img.src = photoUrl;
  }, [photoUrl]);

  // Animate 0 → 95 % over ~9 s
  useEffect(() => {
    const DURATION = 9000;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(95, Math.round(((now - start) / DURATION) * 100));
      setPct(p);
      setPhase(p < 30 ? 0 : p < 75 ? 1 : 2);
      if (p < 95) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const displayUrl =
    phase === 2 && segUrl  ? segUrl  :
    phase === 1 && heatUrl ? heatUrl :
    photoUrl;

  const phaseLabel =
    phase === 2 ? "Поиск области поражения..." :
    phase === 1 ? "YCbCr анализ кожи..." :
    STEP_LABELS[currentStep];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background overflow-hidden">

      {/* Title */}
      <p className="text-on-surface-variant text-sm font-semibold mb-5 tracking-wide">
        SkinX AI обрабатывает...
      </p>

      {/* Photo card — switches between original / heatmap / segmentation */}
      <div className="w-[280px] h-[280px] rounded-2xl overflow-hidden bg-[#000a18] shadow-ambient-xl relative">
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={phase}
            src={displayUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{ animation: "fadeIn 0.6s ease" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Phase badge overlay */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <span className="text-white text-[10px] font-bold uppercase tracking-wider">
            {phase === 2 ? "AI АНАЛИЗ" : phase === 1 ? "ТЕПЛОВИЗОР" : "ОРИГИНАЛ"}
          </span>
        </div>
      </div>

      {/* Percentage */}
      <div className="mt-7 flex items-baseline gap-1">
        <span className="text-5xl font-black tabular-nums text-primary">{pct}</span>
        <span className="text-2xl font-bold text-primary/70">%</span>
      </div>

      {/* Progress bar */}
      <div className="w-[280px] mt-3 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Step label */}
      <div className="mt-4 flex items-center gap-2">
        <span className="w-3 h-3 border-[1.5px] border-primary/40 border-t-primary rounded-full animate-spin flex-shrink-0" />
        <p className="text-on-surface-variant text-xs font-medium">{phaseLabel}</p>
      </div>
    </div>
  );
}

type ScanStep = "zones" | "scan";

function useThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = useCallback(() => {
    const html = document.documentElement;
    html.classList.toggle("dark");
    setIsDark(html.classList.contains("dark"));
  }, []);
  return { isDark, toggle };
}

export function ScanClient({ gender = "male" }: { gender?: "male" | "female" }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { isDark, toggle: toggleTheme } = useThemeToggle();

  const [step,         setStep]         = useState<ScanStep>("zones");
  const [selectedZone,    setSelectedZone]    = useState<string | null>(null);
  const [bodyNormX,    setBodyNormX]    = useState<number | null>(null);
  const [bodyNormY,    setBodyNormY]    = useState<number | null>(null);
  const [bodySide,     setBodySide]     = useState<"front" | "back">("front");
  const [preview,      setPreview]      = useState<string | null>(null);
  const [file,         setFile]         = useState<File | null>(null);
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [cameraOpen,   setCameraOpen]   = useState(false);
  function handleCapture(capturedFile: File, previewUrl: string) {
    setFile(capturedFile);
    setPreview(previewUrl);
    setCameraOpen(false);
    setError(null);
  }

  function openGallery() { fileRef.current?.click(); }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }

  function retake() {
    setFile(null);
    setPreview(null);
    setCameraOpen(true);
  }

  async function submit() {
    if (!file) { setCameraOpen(true); return; }
    setUploading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("image", file);
      if (selectedZone) fd.append("body_area", selectedZone);
      if (bodyNormX !== null) fd.append("body_x", String(bodyNormX));
      if (bodyNormY !== null) fd.append("body_y", String(bodyNormY));
      fd.append("body_side", bodySide);
      fd.append("locale", locale);
      const res = await fetch("/api/scans", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (res.status === 429) throw new Error(t.scan.rateLimitError);
        throw new Error(j.error || t.scan.uploadFailed);
      }
      const j = await res.json();
      trackEvent("scan_completed", { 
        zone: selectedZone || "none", 
        side: bodySide,
        has_zone: !!selectedZone 
      });
      router.push(`/moles/${j.id}`);
      router.refresh();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? t.scan.uploadFailed);
      setUploading(false);
    }
  }

  // ── Step: body pin picker ─────────────────────────────────────────────────
  if (step === "zones") {
    return (
      <div className="h-screen w-screen flex flex-col bg-background text-on-surface overflow-hidden">
        {/* Close button */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-14 pb-2">
          <Link
            href="/home"
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center active:scale-95 transition-transform"
          >
            <Icon name="close" />
          </Link>
          <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">SkinX</span>
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Body pin picker */}
        <div className="flex-1 overflow-hidden">
          <BodyMapSVG
            gender={gender}
            onSelect={(zone, normX, normY, side) => {
              trackEvent("zone_selected", { zone, side });
              setSelectedZone(zone);
              setBodyNormX(normX);
              setBodyNormY(normY);
              setBodySide(side);
              setStep("scan");
              setCameraOpen(true);
            }}
            onSkip={() => {
              setSelectedZone(null);
              setBodyNormX(null);
              setBodyNormY(null);
              setStep("scan");
              setCameraOpen(true);
            }}
          />
        </div>
      </div>
    );
  }

  // ── Step: scan (camera + upload) ────────────────────────────────────────
  return (
    <>
      {cameraOpen && (
        <ScanCamera
          onCapture={handleCapture}
          onClose={() => setCameraOpen(false)}
          bodyArea={selectedZone ?? undefined}
        />
      )}

      {uploading && <AnalyzingOverlay photoUrl={preview} />}

      <div className="h-screen w-screen flex flex-col relative bg-background text-on-surface overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-background" />
          )}
          <div className="absolute inset-0 bg-background/40" />
        </div>

        {/* Header */}
        <header className="relative z-50 flex justify-between items-center w-full px-5 py-4" style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}>
          <button
            onClick={() => { setStep("zones"); setFile(null); setPreview(null); }}
            className="w-11 h-11 rounded-full bg-surface-container backdrop-blur-xl flex items-center justify-center shadow-ambient active:scale-95 transition-transform"
          >
            <Icon name="arrow_back" />
          </button>

          <div className="px-4 py-1.5 rounded-full bg-surface-container/80 backdrop-blur-md">
            <span className="text-on-surface-variant text-xs font-medium tracking-wide uppercase">SkinX Scan</span>
          </div>

          {preview ? (
            <button
              onClick={retake}
              className="w-11 h-11 rounded-full bg-surface-container backdrop-blur-xl flex items-center justify-center active:scale-95 transition-transform"
            >
              <Icon name="refresh" />
            </button>
          ) : (
            <div className="w-11 h-11 rounded-full bg-surface-container/60 backdrop-blur-xl flex items-center justify-center text-on-surface-variant">
              <Icon name="info" />
            </div>
          )}
        </header>

        {/* Viewfinder */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-64 h-64 rounded-[2rem] relative overflow-hidden flex items-center justify-center mb-10">
            {/* Corner brackets (always visible) */}
            <div className="absolute top-0 left-0 w-9 h-9 border-t-[3px] border-l-[3px] border-on-surface/30 rounded-tl-[2rem] z-20" />
            <div className="absolute top-0 right-0 w-9 h-9 border-t-[3px] border-r-[3px] border-on-surface/30 rounded-tr-[2rem] z-20" />
            <div className="absolute bottom-0 left-0 w-9 h-9 border-b-[3px] border-l-[3px] border-on-surface/30 rounded-bl-[2rem] z-20" />
            <div className="absolute bottom-0 right-0 w-9 h-9 border-b-[3px] border-r-[3px] border-on-surface/30 rounded-br-[2rem] z-20" />

            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="animate-scan-sweep bg-on-surface/20 shadow-[0_0_8px_rgba(var(--color-on-surface),0.15)]" />
                </div>
                <button
                  onClick={() => setCameraOpen(true)}
                  className="flex flex-col items-center gap-3 active:scale-95 transition-transform"
                >
                  <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                    <Icon name="photo_camera" filled className="text-on-surface-variant text-3xl" />
                  </div>
                  <span className="text-on-surface-variant text-xs font-medium">{t.scan.openCamera}</span>
                </button>
              </>
            )}
          </div>

          {/* Status pill */}
          <div className="bg-surface-container/80 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-ambient">
            <Icon
              name={preview ? "check_circle" : "photo_camera"}
              filled={!!preview}
              className={`text-sm ${preview ? "text-emerald-400" : "text-on-surface-variant"}`}
            />
            <span className="text-sm font-medium">
              {preview ? t.scan.imageReady : t.scan.holdSteady}
            </span>
          </div>
        </main>

        {/* Bottom sheet */}
        <div className="relative z-50 w-full bg-surface-container-low rounded-t-[2rem] shadow-ambient-xl px-5 py-6 pb-10 flex flex-col gap-5">
          <div className="w-10 h-1 bg-outline-variant/30 rounded-full mx-auto -mt-2 mb-1" />
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

          {/* Zone indicator (tap to change zone) */}
          <button
            onClick={() => setStep("zones")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all active:scale-[0.98] ${
              selectedZone
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                : "bg-surface-container border-outline-variant/30 text-on-surface-variant"
            }`}
          >
            <div className={`w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 ${!selectedZone && "opacity-40"}`}>
              {selectedZone ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/assets/images/${gender}/${selectedZone}.jpg`}
                  alt=""
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                  <Icon name="body_system" className="text-xs" />
                </div>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold leading-none text-on-surface">
                {selectedZone ? getZoneDisplayLabel(selectedZone, locale) : t.scan.selectZone}
              </p>
              <p className={`text-[10px] mt-0.5 ${selectedZone ? "text-emerald-500/60" : "text-on-surface-variant/60"}`}>
                {selectedZone ? t.scan.selectZoneHint : t.scan.tapBodyArea}
              </p>
            </div>
            <Icon name="chevron_right" className={`text-sm ${selectedZone ? "text-emerald-500/60" : "text-on-surface-variant/40"}`} />
          </button>

          {/* Action row */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={openGallery}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-[72px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center">
                <Icon name="folder_open" className="text-on-surface-variant" />
              </div>
              <span className="text-on-surface-variant text-[10px] font-medium text-center leading-tight">{t.scan.chooseFromLibrary}</span>
            </button>

            <button
              onClick={() => {
                if (!file && !selectedZone) { setStep("zones"); return; }
                submit();
              }}
              disabled={uploading}
              className="w-[76px] h-[76px] rounded-full p-[5px] active:scale-90 transition-all duration-200 disabled:opacity-60 bg-primary-gradient shadow-primary-glow"
              aria-label={file ? t.scan.analyzePhoto : t.scan.openCamera}
            >
              <div className="w-full h-full rounded-full border-[3.5px] border-white/80 flex items-center justify-center">
                {file
                  ? <Icon name="arrow_upward" className="text-white text-xl" />
                  : <Icon name="photo_camera" filled className="text-white text-xl" />}
              </div>
            </button>

            {file ? (
              <button
                onClick={retake}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-[72px]"
              >
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center">
                  <Icon name="refresh" className="text-on-surface-variant" />
                </div>
                <span className="text-on-surface-variant text-[10px] font-medium text-center leading-tight">Retake</span>
              </button>
            ) : (
              <div className="w-[72px]" />
            )}
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center font-medium">{error}</p>
          )}
        </div>
      </div>
    </>
  );
}
