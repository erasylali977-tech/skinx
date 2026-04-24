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

// ── Types ──────────────────────────────────────────────────────────────────
type PermState = "idle" | "requesting" | "denied" | "granted" | "error";

interface Props {
  onCapture: (file: File, previewUrl: string) => void;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────
export function ScanCamera({ onCapture, onClose }: Props) {
  const { t } = useI18n();

  const videoRef   = useRef<HTMLVideoElement>(null);
  const sampleRef  = useRef<HTMLCanvasElement>(null); // analysis canvas (hidden)
  const captureRef = useRef<HTMLCanvasElement>(null); // capture canvas (hidden)
  const streamRef  = useRef<MediaStream | null>(null);
  const rafRef     = useRef<number>(0);

  const [perm,   setPerm]   = useState<PermState>("idle");
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [det,    setDet]    = useState({ skinPct: 0, brightness: 128, sharpness: 50 });

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

  // ── Detection loop at ~150 ms intervals ───────────────────────────────
  useEffect(() => {
    if (perm !== "granted") return;
    let last = 0;
    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (now - last < 150) return;
      last = now;
      if (videoRef.current && sampleRef.current) {
        setDet(analyzeFrame(videoRef.current, sampleRef.current));
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

  const statusText =
    isDark   ? t.scan.tooDark :
    isBright ? t.scan.tooBright :
    isBlurry ? t.scan.blurry :
    skinOk   ? t.scan.skinDetected :
               t.scan.alignSkin;

  const statusColor  = ready ? "text-emerald-400"
    : (isDark || isBright || isBlurry) ? "text-amber-400"
    : "text-white/70";

  const frameColor   = ready ? "border-emerald-400" : "border-[#4d9dff]";
  const lineColor    = ready
    ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
    : "bg-[#4d9dff] shadow-[0_0_10px_rgba(77,157,255,0.7)]";

  const shutterStyle = ready
    ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_28px_rgba(52,211,153,0.45)]"
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
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
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

      {/* Live video feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover"
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

        <button
          onClick={flip}
          className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
          aria-label={t.scan.flipCamera}
        >
          <Icon name="flip_camera_ios" />
        </button>
      </header>

      {/* ── Viewfinder ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5">
        <div className="relative w-64 h-64">

          {/* Corner brackets — change color when skin is ready */}
          <div className={`absolute top-0 left-0 w-9 h-9 border-t-[3px] border-l-[3px] ${frameColor} rounded-tl-[2rem] transition-colors duration-500`} />
          <div className={`absolute top-0 right-0 w-9 h-9 border-t-[3px] border-r-[3px] ${frameColor} rounded-tr-[2rem] transition-colors duration-500`} />
          <div className={`absolute bottom-0 left-0 w-9 h-9 border-b-[3px] border-l-[3px] ${frameColor} rounded-bl-[2rem] transition-colors duration-500`} />
          <div className={`absolute bottom-0 right-0 w-9 h-9 border-b-[3px] border-r-[3px] ${frameColor} rounded-br-[2rem] transition-colors duration-500`} />

          {/* Sweep scan line — contained within frame */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ borderRadius: "2rem" }}
          >
            <div className={`animate-scan-sweep ${lineColor} transition-colors duration-500`} />
          </div>

          {/* Skin-coverage arc (SVG ring) */}
          <svg
            viewBox="0 0 256 256"
            className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
            aria-hidden
          >
            <circle
              cx="128" cy="128" r="110"
              fill="none"
              stroke={ready ? "#34d399" : "#4d9dff"}
              strokeWidth="3"
              strokeDasharray={`${Math.min((det.skinPct / 100) * 691.2, 691.2).toFixed(1)} 691.2`}
              strokeLinecap="round"
              transform="rotate(-90 128 128)"
              style={{ transition: "stroke-dasharray 0.4s ease, stroke 0.5s ease" }}
            />
          </svg>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2.5 bg-black/55 backdrop-blur-md px-5 py-2.5 rounded-full">
          {ready ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
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
                  isDark ? "bg-amber-400" : isBright ? "bg-red-400" : "bg-emerald-400"
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
                  isBlurry ? "bg-amber-400" : "bg-emerald-400"
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
              className={`text-3xl transition-colors duration-300 ${skinOk ? "text-emerald-400" : "text-white/25"}`}
            />
            <span className={`text-xs font-semibold transition-colors duration-300 ${skinOk ? "text-emerald-400" : "text-white/30"}`}>
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
              className={`text-3xl transition-colors duration-300 ${ready ? "text-emerald-400" : "text-white/25"}`}
            />
            <span className={`text-[10px] font-medium text-center leading-tight transition-colors duration-300 ${ready ? "text-emerald-400" : "text-white/30"}`}>
              {ready ? "Ready" : "Align"}
            </span>
          </div>
        </div>
      </div>

      {/* Hidden canvases for analysis & capture */}
      <canvas ref={sampleRef}  className="hidden" aria-hidden />
      <canvas ref={captureRef} className="hidden" aria-hidden />
    </div>
  );
}
