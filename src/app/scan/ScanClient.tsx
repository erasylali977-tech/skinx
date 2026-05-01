"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/context";
import { ScanCamera } from "./ScanCamera";
import { type BodyGender } from "@/lib/bodyZones";
import { type ImageZoneId, ZONE_DETAIL_MAP } from "@/lib/zoneDetails";
import { ZoneGrid } from "@/components/ZoneGrid";

// ── Analyzing overlay shown while AI processes the image ───────────────────
function AnalyzingOverlay({ photoUrl }: { photoUrl: string | null }) {
  const { t } = useI18n();
  const AI_STEPS = [t.scan.stepTexture, t.scan.stepColor, t.scan.stepShape, t.scan.stepRisk];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setStep(prev => (prev < AI_STEPS.length - 1 ? prev + 1 : prev)),
      1400,
    );
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden">
      {/* Blurred photo background */}
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover scale-110" />
      )}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-8 w-full max-w-xs text-white">
        {/* Pulsing rings + icon */}
        <div className="relative flex items-center justify-center w-32 h-32">
          <div
            className="absolute w-32 h-32 rounded-full border-2 border-primary/40 animate-ping"
            style={{ animationDuration: "2s" }}
          />
          <div
            className="absolute w-24 h-24 rounded-full border-2 border-primary/60 animate-ping"
            style={{ animationDuration: "2s", animationDelay: "0.6s" }}
          />
          <div className="w-20 h-20 rounded-full bg-primary shadow-primary-glow flex items-center justify-center">
            <Icon name="psychology" filled className="text-white text-4xl" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold tracking-tight">{t.scan.analyzing}</h2>
          <p className="text-white/50 text-sm mt-1">{t.scan.analyzingHint}</p>
        </div>

        {/* Step progress */}
        <div className="w-full space-y-3">
          {AI_STEPS.map((label, i) => {
            const done   = i < step;
            const active = i === step;
            return (
              <div key={label} className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-500 ${
                    done   ? "bg-emerald-500"
                    : active ? "bg-primary ring-4 ring-primary/25"
                    : "bg-white/10"
                  }`}
                >
                  {done && <Icon name="check" className="text-white text-[10px]" />}
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-semibold transition-colors ${done || active ? "text-white" : "text-white/30"}`}>
                    {label}
                  </p>
                  {active && (
                    <div className="mt-1 h-[2px] bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-fill-bar" />
                    </div>
                  )}
                </div>
                {done && <Icon name="check_circle" filled className="text-emerald-400 text-sm flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type ScanStep = "zones" | "scan";

export function ScanClient() {
  const router = useRouter();
  const { t, locale } = useI18n();
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
      fd.append("locale", locale);
      const res = await fetch("/api/scans", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (res.status === 429) throw new Error(t.scan.rateLimitError);
        throw new Error(j.error || t.scan.uploadFailed);
      }
      const j = await res.json();
      // Keep overlay visible during navigation — component unmounts when new page loads
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
          <div className="w-64 h-64 rounded-[2rem] relative flex items-center justify-center mb-10">
            <div className="absolute top-0 left-0 w-9 h-9 border-t-[3px] border-l-[3px] border-on-surface/30 rounded-tl-[2rem]" />
            <div className="absolute top-0 right-0 w-9 h-9 border-t-[3px] border-r-[3px] border-on-surface/30 rounded-tr-[2rem]" />
            <div className="absolute bottom-0 left-0 w-9 h-9 border-b-[3px] border-l-[3px] border-on-surface/30 rounded-bl-[2rem]" />
            <div className="absolute bottom-0 right-0 w-9 h-9 border-b-[3px] border-r-[3px] border-on-surface/30 rounded-br-[2rem]" />

            {!preview && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: "2rem" }}>
                <div className="animate-scan-sweep bg-on-surface/20 shadow-[0_0_8px_rgba(var(--color-on-surface),0.15)]" />
              </div>
            )}

            {!preview && (
              <button
                onClick={() => setCameraOpen(true)}
                className="flex flex-col items-center gap-3 active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                  <Icon name="photo_camera" filled className="text-on-surface-variant text-3xl" />
                </div>
                <span className="text-on-surface-variant text-xs font-medium">{t.scan.openCamera}</span>
              </button>
            )}
          </div>

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
              disabled={uploading}
              className={`w-[76px] h-[76px] rounded-full p-[5px] active:scale-90 transition-all duration-200 disabled:opacity-60 ${
                file
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_28px_rgba(52,211,153,0.4)]"
                  : "bg-primary-gradient shadow-primary-glow"
              }`}
              aria-label={file ? t.scan.analyzePhoto : t.scan.openCamera}
            >
              <div className="w-full h-full rounded-full border-[3.5px] border-white/80 flex items-center justify-center">
                {uploading ? (
                  <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : file ? (
                  <Icon name="arrow_upward" className="text-white text-xl" />
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
