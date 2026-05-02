"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/context";
import { ScanCamera } from "./ScanCamera";
import { type ImageZoneId, type BodyGender, ZONE_DETAIL_MAP } from "@/lib/zoneDetails";
import { ZoneGrid } from "@/components/ZoneGrid";
import { cropByBoundingBox, type RoboflowBox } from "@/lib/utils/imageProcessing";

// Zones that use Smart Capture: Roboflow detect → bbox overlay → crop → Gemini
const SMART_CROP_ZONES = new Set<ImageZoneId>(["face", "arms"]);

interface DetectionResult {
  box: RoboflowBox;
  imgW: number;
  imgH: number;
}

// ── Canvas effect helpers ───────────────────────────────────────────────────
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

// ── Analyzing overlay: 3-phase heatmap animation ───────────────────────────
function AnalyzingOverlay({ photoUrl }: { photoUrl: string | null }) {
  const { t } = useI18n();
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState(0); // 0=original 1=heatmap 2=segmentation
  const [heatUrl, setHeatUrl] = useState<string | null>(null);
  const [segUrl,  setSegUrl]  = useState<string | null>(null);

  const STEP_LABELS = [
    t.scan.stepTexture,
    t.scan.stepColor,
    t.scan.stepShape,
    t.scan.stepRisk,
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
    phase === 2 ? "Сегментация новообразования" :
    phase === 1 ? "Тепловая карта анализа" :
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
            {phase === 2 ? "SEGMENT" : phase === 1 ? "THERMAL" : "ORIGINAL"}
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

export function ScanClient() {
  const router = useRouter();
  const { t, locale } = useI18n();
  console.log("SkinX Debug: Version 1.1 - Roboflow Integration Active");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [step,         setStep]         = useState<ScanStep>("zones");
  const [gender,       setGender]       = useState<BodyGender>("male");

  // Persist & restore gender preference
  useEffect(() => {
    const saved = localStorage.getItem("skinx_gender") as BodyGender | null;
    if (saved === "male" || saved === "female") setGender(saved);
  }, []);

  function changeGender(g: BodyGender) {
    setGender(g);
    localStorage.setItem("skinx_gender", g);
  }
  const [selectedZone,    setSelectedZone]    = useState<ImageZoneId | null>(null);
  const [preview,      setPreview]      = useState<string | null>(null);
  const [file,         setFile]         = useState<File | null>(null);
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [cameraOpen,   setCameraOpen]   = useState(false);
  const boxCanvasRef                      = useRef<HTMLCanvasElement | null>(null);
  const [detecting,       setDetecting]       = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);

  // ── Auto-detect after capture for smart-crop zones ─────────────────────
  function triggerDetection(capturedFile: File, zone: ImageZoneId | null) {
    if (!zone || !SMART_CROP_ZONES.has(zone)) return;
    setDetecting(true);
    setDetectionResult(null);
    fetch(`/api/detect?zone=${encodeURIComponent(zone)}`, { method: "POST", body: capturedFile })
      .then(r => r.ok ? r.json() : null)
      .then((data: { predictions?: RoboflowBox[]; image?: { width: number; height: number } } | null) => {
        if (!data) return;
        const best = (data.predictions ?? []).sort((a, b) => b.confidence - a.confidence)[0];
        if (best && best.confidence >= 0.20) {
          setDetectionResult({ box: best, imgW: data.image?.width ?? 640, imgH: data.image?.height ?? 640 });
        }
      })
      .catch(() => {})
      .finally(() => setDetecting(false));
  }

  function handleCapture(capturedFile: File, previewUrl: string) {
    setFile(capturedFile);
    setPreview(previewUrl);
    setCameraOpen(false);
    setError(null);
    setDetectionResult(null);
    triggerDetection(capturedFile, selectedZone);
  }

  function openGallery() { fileRef.current?.click(); }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
    setDetectionResult(null);
    triggerDetection(f, selectedZone);
  }

  function retake() {
    setFile(null);
    setPreview(null);
    setCameraOpen(true);
    setDetectionResult(null);
    setDetecting(false);
  }

  // ── Draw detection bbox on the preview canvas ─────────────────────────
  useEffect(() => {
    const canvas = boxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!detectionResult) return;

    const { box, imgW, imgH } = detectionResult;
    const cw = canvas.width;   // 256
    const ch = canvas.height;  // 256

    // Scale accounting for object-cover in square canvas
    const scale = Math.max(cw / imgW, ch / imgH);
    const ox = (cw - imgW * scale) / 2;
    const oy = (ch - imgH * scale) / 2;
    const x = (box.x - box.width  / 2) * scale + ox;
    const y = (box.y - box.height / 2) * scale + oy;
    const w = box.width  * scale;
    const h = box.height * scale;

    ctx.strokeStyle = "rgba(77,157,255,0.95)";
    ctx.lineWidth   = 2.5;
    ctx.strokeRect(x, y, w, h);

    const label = `${box.class}  ${Math.round(box.confidence * 100)}%`;
    ctx.font = "bold 11px system-ui, sans-serif";
    const tw = ctx.measureText(label).width + 10;
    ctx.fillStyle = "rgba(61,122,237,0.92)";
    ctx.fillRect(x, Math.max(0, y - 20), tw, 18);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + 5, Math.max(12, y - 6));
  }, [detectionResult]);

  async function submit() {
    if (!file) { setCameraOpen(true); return; }
    setUploading(true);
    setError(null);

    // Use pre-computed detection result (from triggerDetection after capture).
    // If detection found a bbox → crop to it. Otherwise send full image.
    let fileToAnalyze: File = file;
    if (detectionResult) {
      try {
        fileToAnalyze = await cropByBoundingBox(
          file,
          detectionResult.box,
          detectionResult.imgW,
          detectionResult.imgH,
        );
      } catch { /* fallback to full image */ }
    }

    try {
      const fd = new FormData();
      fd.append("image", fileToAnalyze);
      if (selectedZone) fd.append("body_area", selectedZone);
      fd.append("locale", locale);
      const res = await fetch("/api/scans", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (res.status === 429) throw new Error(t.scan.rateLimitError);
        throw new Error(j.error || t.scan.uploadFailed);
      }
      const j = await res.json();
      router.push(`/moles/${j.id}`);
      router.refresh();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? t.scan.uploadFailed);
      setUploading(false);
    }
  }

  // ── Step: zone grid ────────────────────────────────────────────────────
  if (step === "zones") {
    return (
      <div className="h-screen w-screen flex flex-col bg-background text-on-surface overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 flex justify-between items-center px-5 pt-14 pb-3">
          <Link
            href="/home"
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center active:scale-95 transition-transform"
          >
            <Icon name="close" />
          </Link>

          <div className="text-center">
            <h1 className="text-sm font-semibold">{t.scan.selectZoneTitle}</h1>
            <p className="text-on-surface-variant text-[11px]">{t.scan.tapBodyArea}</p>
          </div>

          {/* Gender toggle */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => changeGender("male")}
              className={`flex items-center justify-center w-14 h-14 rounded-2xl font-bold transition-all active:scale-95 ${
                gender === "male"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/40"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              <span style={{ lineHeight: 0, fontSize: "28px" }}>♂</span>
            </button>
            <button
              onClick={() => changeGender("female")}
              className={`flex items-center justify-center w-14 h-14 rounded-2xl font-bold transition-all active:scale-95 ${
                gender === "female"
                  ? "bg-pink-500 text-white shadow-lg shadow-pink-500/40"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              <span style={{ lineHeight: 0, fontSize: "28px" }}>♀</span>
            </button>
          </div>
        </header>

        {/* Zone grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          <ZoneGrid
            gender={gender}
            onSelect={(zone) => {
              setSelectedZone(zone);
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
        <header className="relative z-50 flex justify-between items-center w-full px-5 py-4 pt-14">
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
              <>
                {/* Frozen preview image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-cover" />

                {/* Detection bbox canvas overlay */}
                <canvas
                  ref={boxCanvasRef}
                  width={256}
                  height={256}
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                />

                {/* "Detecting…" spinner */}
                {detecting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                    <div className="flex flex-col items-center gap-2">
                      <span className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span className="text-white text-[10px] font-medium">Scanning...</span>
                    </div>
                  </div>
                )}
              </>
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
            {detecting ? (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
            ) : detectionResult ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            ) : (
              <Icon
                name={preview ? "check_circle" : "photo_camera"}
                filled={!!preview}
                className={`text-sm ${preview ? "text-emerald-400" : "text-on-surface-variant"}`}
              />
            )}
            <span className="text-sm font-medium">
              {detecting
                ? "Detecting lesion…"
                : detectionResult
                  ? `Detected: ${detectionResult.box.class} ${Math.round(detectionResult.box.confidence * 100)}%`
                  : preview
                    ? t.scan.imageReady
                    : t.scan.holdSteady}
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
                {selectedZone ? ZONE_DETAIL_MAP[selectedZone].name[locale] : t.scan.selectZone}
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
              disabled={uploading || detecting}
              className={`w-[76px] h-[76px] rounded-full p-[5px] active:scale-90 transition-all duration-200 disabled:opacity-60 ${
                file && detectionResult
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_28px_rgba(52,211,153,0.4)]"
                  : file
                    ? "bg-primary-gradient shadow-primary-glow"
                    : "bg-primary-gradient shadow-primary-glow"
              }`}
              aria-label={file ? t.scan.analyzePhoto : t.scan.openCamera}
            >
              <div className="w-full h-full rounded-full border-[3.5px] border-white/80 flex items-center justify-center">
                {uploading || detecting ? (
                  <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : file ? (
                  <Icon name={detectionResult ? "check" : "arrow_upward"} className="text-white text-xl" />
                ) : (
                  <Icon name="photo_camera" filled className="text-white text-xl" />
                )}
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
