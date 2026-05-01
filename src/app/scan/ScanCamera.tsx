"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/context";

// ── Skin detection via YCbCr color space ──────────────────────────────────
// Covers Fitzpatrick I–VI skin tones robustly across all lighting conditions.
// Algorithm: for each sampled pixel, convert RGB → YCbCr and test against
// the well-known skin locus (Peer et al. 2003 / Jones & Rehg 2002).
function analyzeFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): { skinPct: number; brightness: number; sharpness: number } {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || video.readyState < 2) return { skinPct: 0, brightness: 128, sharpness: 50 };

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return { skinPct: 0, brightness: 128, sharpness: 50 };

  // Sample the center 200×200 region of the video frame
  const SW = 200, SH = 200;
  canvas.width = SW;
  canvas.height = SH;
  ctx.drawImage(video, (vw - SW) >> 1, (vh - SH) >> 1, SW, SH, 0, 0, SW, SH);

  const { data: d } = ctx.getImageData(0, 0, SW, SH);
  let skinCount = 0;
  let brightnessSum = 0;
  let lapSum = 0;
  let total = 0;
  let lapCnt = 0;

  // Step 4 pixels for performance (~625 samples at 4px stride over 200×200)
  for (let row = 0; row < SH; row += 4) {
    for (let col = 0; col < SW; col += 4) {
      const i = (row * SW + col) * 4;
      const r = d[i], g = d[i + 1], b = d[i + 2];

      // YCbCr conversion (BT.601)
      const y  =  0.299 * r + 0.587 * g + 0.114 * b;
      const cb = -0.169 * r - 0.331 * g + 0.500 * b + 128;
      const cr =  0.500 * r - 0.419 * g - 0.081 * b + 128;

      // Skin locus: Y > 80, Cb ∈ [77,127], Cr ∈ [133,173]
      if (y > 80 && cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173) skinCount++;

      brightnessSum += y;
      total++;

      // Laplacian approximation for sharpness (forward difference)
      if (col + 4 < SW && row + 4 < SH) {
        const ir = (row * SW + col + 4) * 4;
        const id = ((row + 4) * SW + col) * 4;
        const yr = 0.299 * d[ir] + 0.587 * d[ir + 1] + 0.114 * d[ir + 2];
        const yd = 0.299 * d[id] + 0.587 * d[id + 1] + 0.114 * d[id + 2];
        lapSum += Math.abs(y - yr) + Math.abs(y - yd);
        lapCnt++;
      }
    }
  }

  return {
    skinPct:    total > 0  ? (skinCount / total) * 100          : 0,
    brightness: total > 0  ? brightnessSum / total               : 128,
    sharpness:  lapCnt > 0 ? Math.min(100, (lapSum / lapCnt) * 5) : 50,
  };
}

// ── Roboflow prediction type ───────────────────────────────────────────────
interface RoboflowPrediction {
  x: number; y: number;         // center of bounding box
  width: number; height: number;
  confidence: number;           // 0–1
  class: string;
}

const CLASS_LABELS: Record<string, string> = {
  akiec: "Actinic Keratosis",
  bcc:   "Basal Cell Carcinoma",
  bkl:   "Benign Lesion",
  df:    "Dermatofibroma",
  mel:   "Melanoma",
  nv:    "Nevi",
  vasc:  "Vascular",
};

// ── Draw Roboflow bounding boxes on the overlay canvas ────────────────────
function drawPredictions(
  canvas: HTMLCanvasElement,
  preds: RoboflowPrediction[],
  imgW: number,
  imgH: number,
  t: number
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!preds.length) return;

  const sx    = canvas.width  / imgW;
  const sy    = canvas.height / imgH;
  const pulse = 0.75 + 0.25 * Math.abs(Math.sin(t / 700));

  for (const p of preds) {
    if (p.confidence < 0.3) continue;
    const x = (p.x - p.width  / 2) * sx;
    const y = (p.y - p.height / 2) * sy;
    const w = p.width  * sx;
    const h = p.height * sy;

    // Outer glow
    ctx.shadowColor = "rgba(77,157,255,0.55)";
    ctx.shadowBlur  = 14;
    ctx.strokeStyle = `rgba(77,157,255,${(pulse * 0.4).toFixed(2)})`;
    ctx.lineWidth   = 6;
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);

    // Main box
    ctx.shadowBlur  = 0;
    ctx.strokeStyle = `rgba(77,157,255,${pulse.toFixed(2)})`;
    ctx.lineWidth   = 2;
    ctx.strokeRect(x, y, w, h);

    // Corner ticks
    const tc = 10;
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.moveTo(x,          y + tc); ctx.lineTo(x,      y    ); ctx.lineTo(x + tc,     y    );
    ctx.moveTo(x + w - tc, y    ); ctx.lineTo(x + w,  y    ); ctx.lineTo(x + w,      y + tc);
    ctx.moveTo(x,      y + h - tc); ctx.lineTo(x,      y + h); ctx.lineTo(x + tc,    y + h );
    ctx.moveTo(x + w - tc, y + h); ctx.lineTo(x + w,  y + h); ctx.lineTo(x + w, y + h - tc);
    ctx.stroke();

    // Label pill
    const label = `${CLASS_LABELS[p.class] ?? p.class}  ${Math.round(p.confidence * 100)}%`;
    ctx.font = "bold 11px system-ui, sans-serif";
    const tw = ctx.measureText(label).width + 10;
    ctx.fillStyle = `rgba(61,122,237,${(pulse * 0.9).toFixed(2)})`;
    ctx.beginPath();
    ctx.roundRect(x, y - 20, tw, 18, 4);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + 5, y - 6);
  }
}

// ── Types ──────────────────────────────────────────────────────────────────
type PermState = "idle" | "requesting" | "denied" | "granted" | "error";

interface Props {
  onCapture: (file: File, previewUrl: string) => void;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────
export function ScanCamera({ onCapture, onClose }: Props) {
  const { t } = useI18n();

  const videoRef      = useRef<HTMLVideoElement>(null);
  const sampleRef     = useRef<HTMLCanvasElement>(null);
  const captureRef    = useRef<HTMLCanvasElement>(null);
  const overlayRef    = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const rafRef        = useRef<number>(0);
  const predictRef    = useRef<RoboflowPrediction[]>([]);
  const imgDimsRef    = useRef({ w: 200, h: 200 });
  const aiCameraOnRef = useRef(true);

  const [perm,           setPerm]          = useState<PermState>("idle");
  const [facing,         setFacing]        = useState<"environment" | "user">("environment");
  const [det,            setDet]           = useState({ skinPct: 0, brightness: 128, sharpness: 50 });
  const [aiCameraOn,     setAiCameraOn]    = useState(true);
  const [zoom,           setZoom]          = useState(1);
  const [torch,          setTorch]         = useState(false);
  const [lesionDetected, setLesionDetected] = useState(false);

  // ── Open camera stream ─────────────────────────────────────────────────
  // NOTE: we set perm("granted") BEFORE touching videoRef, because the
  // <video> element only mounts after that state change. Stream attachment
  // happens in the useEffect below once the element is in the DOM.
  const startStream = useCallback(async (face: "environment" | "user") => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPerm("error");
      return;
    }
    setPerm("requesting");
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: face,
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setPerm("granted"); // triggers re-render → <video> appears in DOM
    } catch (e: unknown) {
      const name = (e as { name?: string })?.name ?? "";
      setPerm(name === "NotAllowedError" || name === "PermissionDeniedError" ? "denied" : "error");
    }
  }, []);

  // ── Attach stream once <video> element is mounted ─────────────────────
  // Runs every time perm transitions to "granted" (initial open + flip)
  useEffect(() => {
    if (perm !== "granted") return;
    const video  = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => {});
  }, [perm]);

  // ── Keep aiCameraOnRef in sync with state ─────────────────────────────
  useEffect(() => { aiCameraOnRef.current = aiCameraOn; }, [aiCameraOn]);

  // ── Detection + overlay loop ───────────────────────────────────────────
  useEffect(() => {
    if (perm !== "granted") return;

    // Fire-and-forget Roboflow inference call
    const doDetect = () => {
      if (!sampleRef.current || !aiCameraOnRef.current) return;
      sampleRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const res = await fetch("/api/detect", { method: "POST", body: blob });
          if (!res.ok) return;
          const data = await res.json() as {
            predictions?: RoboflowPrediction[];
            image?: { width: number; height: number };
          };
          imgDimsRef.current = { w: data.image?.width ?? 200, h: data.image?.height ?? 200 };
          const preds = data.predictions ?? [];
          predictRef.current = preds;
          setLesionDetected(preds.some((p) => p.confidence >= 0.35));
        } catch { /* network error — keep last predictions */ }
      }, "image/jpeg", 0.85);
    };

    let last        = 0;
    let lastDetect  = -9999;

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);

      // Overlay drawn every frame for smooth pulse animation
      if (overlayRef.current) {
        drawPredictions(overlayRef.current, predictRef.current, imgDimsRef.current.w, imgDimsRef.current.h, now);
      }

      // Skin analysis every 150 ms
      if (now - last >= 150) {
        last = now;
        if (videoRef.current && sampleRef.current) {
          setDet(analyzeFrame(videoRef.current, sampleRef.current));
        }
      }

      // Roboflow detect every 1 200 ms
      if (now - lastDetect >= 1200) {
        lastDetect = now;
        doDetect();
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [perm]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Capture photo from live stream ────────────────────────────────────
  const shoot = useCallback(() => {
    const v = videoRef.current;
    const c = captureRef.current;
    if (!v || !c) return;
    c.width  = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    c.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file, URL.createObjectURL(blob));
    }, "image/jpeg", 0.92);
  }, [onCapture]);

  // ── Torch toggle ───────────────────────────────────────────────────────
  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torch;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorch(next);
    } catch { /* not supported on this device */ }
  }, [torch]);

  // ── Flip front ↔ rear ─────────────────────────────────────────────────
  const flip = useCallback(() => {
    const next: "environment" | "user" = facing === "environment" ? "user" : "environment";
    setFacing(next);
    startStream(next);
  }, [facing, startStream]);

  // ── Derived detection state ────────────────────────────────────────────
  const isDark    = det.brightness < 60;
  const isBright  = det.brightness > 215;
  const isBlurry  = det.sharpness  < 6;
  const skinOk    = det.skinPct    > 15;
  const ready     = skinOk && !isBlurry && !isDark && !isBright;

  const aiLesionActive = aiCameraOn && lesionDetected;

  const topPred    = predictRef.current[0];
  const statusText =
    aiLesionActive
      ? (topPred
          ? `${CLASS_LABELS[topPred.class] ?? topPred.class} · ${Math.round(topPred.confidence * 100)}%`
          : "Изменение обнаружено")
      : isDark   ? t.scan.tooDark
      : isBright ? t.scan.tooBright
      : isBlurry ? t.scan.blurry
      : skinOk   ? t.scan.skinDetected
      :            t.scan.alignSkin;

  const statusColor =
    aiLesionActive ? "text-primary" :
    ready ? "text-primary/80" :
    (isDark || isBright || isBlurry) ? "text-amber-400" :
    "text-white/70";

  const frameColor = aiLesionActive ? "border-primary" : ready ? "border-primary/60" : "border-white/25";

  const shutterStyle = ready
    ? "bg-primary-gradient shadow-primary-glow ring-2 ring-primary/30"
    : "bg-primary-gradient shadow-primary-glow";

  // ── IDLE: permission prompt ────────────────────────────────────────────
  if (perm === "idle") {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0c0e13] flex flex-col items-center justify-center gap-8 p-8">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="photo_camera" filled className="text-primary text-6xl" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Icon name="check" className="text-white text-sm" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-3">{t.scan.cameraAccess}</h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-[280px]">
              {t.scan.cameraAccessHint}
            </p>
          </div>
        </div>

        <div className="w-full max-w-[320px] flex flex-col gap-3">
          <button
            onClick={() => startStream("environment")}
            className="w-full py-4 rounded-2xl bg-primary-gradient text-white font-semibold text-base shadow-primary-glow active:scale-95 transition-transform"
          >
            {t.scan.allowCamera}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-white/50 text-sm font-medium active:text-white/80 transition-colors"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    );
  }

  // ── REQUESTING: spinner ────────────────────────────────────────────────
  if (perm === "requesting") {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0c0e13] flex flex-col items-center justify-center gap-4">
        <span className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-white/40 text-sm">{t.common.loading}</p>
      </div>
    );
  }

  // ── DENIED: instructions ───────────────────────────────────────────────
  if (perm === "denied") {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0c0e13] flex flex-col items-center justify-center gap-8 p-8">
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
            <Icon name="no_photography" filled className="text-red-400 text-5xl" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-3">{t.scan.cameraBlocked}</h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-[280px]">
              {t.scan.cameraBlockedHint}
            </p>
          </div>
        </div>
        <div className="w-full max-w-[320px] flex flex-col gap-3">
          <button
            onClick={() => startStream("environment")}
            className="w-full py-4 rounded-2xl bg-white/10 text-white font-semibold active:scale-95 transition-transform"
          >
            {t.scan.tryAgain}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-white/50 text-sm font-medium"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    );
  }

  // ── ERROR ──────────────────────────────────────────────────────────────
  if (perm === "error") {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0c0e13] flex flex-col items-center justify-center gap-6 p-8">
        <Icon name="error" filled className="text-red-400 text-5xl" />
        <p className="text-white/70 text-center text-sm max-w-[260px]">{t.scan.cameraError}</p>
        <button onClick={onClose} className="text-primary text-sm underline">{t.common.back}</button>
      </div>
    );
  }

  // ── GRANTED: live camera ───────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">

      {/* Live video feed (zoom via CSS scale) */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-150"
        style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
      />

      {/* Gradient vignette overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/55 via-transparent via-40% to-black/65" />

      {/* ── Header ── */}
      <header className="relative z-10 flex justify-between items-center px-5 pt-14 pb-4 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
          aria-label="Close"
        >
          <Icon name="close" />
        </button>

        <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md">
          <span className="text-white/70 text-xs font-medium tracking-wide uppercase">SkinX Scan</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleTorch}
            className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center active:scale-90 transition-all ${
              torch ? "bg-amber-400/90 text-gray-900" : "bg-black/50 text-white"
            }`}
            aria-label="Toggle torch"
          >
            <Icon name={torch ? "flash_on" : "flash_off"} />
          </button>
          <button
            onClick={flip}
            className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label={t.scan.flipCamera}
          >
            <Icon name="flip_camera_ios" />
          </button>
        </div>
      </header>

      {/* ── Viewfinder ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5">
        <div className="relative w-64 h-64">

          {/* Corner brackets — change color when skin is ready */}
          <div className={`absolute top-0 left-0 w-9 h-9 border-t-[3px] border-l-[3px] ${frameColor} rounded-tl-[2rem] transition-colors duration-500`} />
          <div className={`absolute top-0 right-0 w-9 h-9 border-t-[3px] border-r-[3px] ${frameColor} rounded-tr-[2rem] transition-colors duration-500`} />
          <div className={`absolute bottom-0 left-0 w-9 h-9 border-b-[3px] border-l-[3px] ${frameColor} rounded-bl-[2rem] transition-colors duration-500`} />
          <div className={`absolute bottom-0 right-0 w-9 h-9 border-b-[3px] border-r-[3px] ${frameColor} rounded-br-[2rem] transition-colors duration-500`} />

          {/* Roboflow bounding-box overlay canvas */}
          <canvas
            ref={overlayRef}
            width={256}
            height={256}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2.5 bg-black/55 backdrop-blur-md px-5 py-2.5 rounded-full">
          {aiLesionActive ? (
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
          ) : ready ? (
            <span className="w-2 h-2 rounded-full bg-primary/50 animate-pulse flex-shrink-0" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-white/30 flex-shrink-0" />
          )}
          <span className={`text-sm font-medium transition-colors duration-300 ${statusColor}`}>
            {statusText}
          </span>
        </div>
      </div>

      {/* ── Bottom control panel ── */}
      <div className="relative z-10 flex-shrink-0 pb-10 pt-6 px-8">

        {/* Metrics bar: brightness + sharpness */}
        <div className="flex items-center justify-between mb-7 px-1">
          {/* Light level */}
          <div className="flex items-center gap-2">
            <Icon
              name="wb_sunny"
              className={`text-lg transition-colors ${isDark || isBright ? "text-amber-400" : "text-white/40"}`}
            />
            <div className="w-20 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isDark ? "bg-amber-400" : isBright ? "bg-red-400" : "bg-primary/70"
                }`}
                style={{ width: `${Math.round((det.brightness / 255) * 100)}%` }}
              />
            </div>
          </div>

          {/* Focus / sharpness */}
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isBlurry ? "bg-amber-400" : "bg-primary/70"
                }`}
                style={{ width: `${Math.round(Math.min(det.sharpness, 100))}%` }}
              />
            </div>
            <Icon
              name="center_focus_strong"
              className={`text-lg transition-colors ${isBlurry ? "text-amber-400" : "text-white/40"}`}
            />
          </div>
        </div>

        {/* Shutter row */}
        <div className="flex items-center justify-between">
          {/* Skin % badge */}
          <div className="w-16 flex flex-col items-center gap-1">
            <Icon
              name="fingerprint"
              className={`text-3xl transition-colors duration-300 ${skinOk ? "text-primary" : "text-white/25"}`}
            />
            <span className={`text-xs font-semibold transition-colors duration-300 ${skinOk ? "text-primary" : "text-white/30"}`}>
              {Math.round(det.skinPct)}%
            </span>
          </div>

          {/* Main shutter button */}
          <button
            onClick={shoot}
            className={`w-[76px] h-[76px] rounded-full p-[5px] active:scale-90 transition-all duration-200 ${shutterStyle}`}
            aria-label="Capture"
          >
            <div className="w-full h-full rounded-full border-[3.5px] border-white/85" />
          </button>

          {/* Ready / not-ready hint */}
          <div className="w-16 flex flex-col items-center gap-1">
            <Icon
              name={ready ? "check_circle" : "radio_button_unchecked"}
              filled={ready}
              className={`text-3xl transition-colors duration-300 ${ready ? "text-primary" : "text-white/25"}`}
            />
            <span className={`text-[10px] font-medium text-center leading-tight transition-colors duration-300 ${ready ? "text-primary" : "text-white/30"}`}>
              {ready ? "Ready" : "Align"}
            </span>
          </div>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 mt-5">
          <Icon name="zoom_out" className="text-white/40 text-base flex-shrink-0" />
          <input
            type="range" min={1} max={3} step={0.05}
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="flex-1 h-1 rounded-full appearance-none bg-white/20 accent-[#4d9dff] cursor-pointer"
          />
          <Icon name="zoom_in" className="text-white/40 text-base flex-shrink-0" />
        </div>

        {/* AI Camera toggle row */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Icon name="smart_toy" className="text-white/50 text-base" />
            <span className="text-white/60 text-xs font-medium">AI Камера</span>
          </div>
          <button
            onClick={() => setAiCameraOn(prev => !prev)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              aiCameraOn ? "bg-primary" : "bg-white/20"
            }`}
            aria-label="Toggle AI Camera"
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
              aiCameraOn ? "left-6" : "left-1"
            }`} />
          </button>
        </div>
      </div>

      {/* Hidden canvases for analysis & capture */}
      <canvas ref={sampleRef}  className="hidden" aria-hidden />
      <canvas ref={captureRef} className="hidden" aria-hidden />
    </div>
  );
}
