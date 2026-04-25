"use client";
import { useRef, useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/context";
import { ScanCamera } from "./ScanCamera";
import { type BodyGender, type BodyZoneId, ZONE_INFO, TORSO_ZONE_IDS, LIMB_ZONE_IDS } from "@/lib/bodyZones";

const BodyMap3D = lazy(() =>
  import("@/components/BodyMap3D").then((m) => ({ default: m.BodyMap3D }))
);

type Step = "zone" | "scan";

export function ScanClient() {
  const router = useRouter();
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [step,       setStep]       = useState<Step>("scan");
  const [gender,     setGender]     = useState<BodyGender>("male");
  const [bodyZone,   setBodyZone]   = useState<BodyZoneId | null>(null);
  const [preview,    setPreview]    = useState<string | null>(null);
  const [file,       setFile]       = useState<File | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Called by ScanCamera when user captures a photo
  function handleCapture(capturedFile: File, previewUrl: string) {
    setFile(capturedFile);
    setPreview(previewUrl);
    setCameraOpen(false);
    setError(null);
  }

  // Gallery / file picker fallback
  function openGallery() {
    fileRef.current?.click();
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }

  // Retake: clear photo and reopen camera
  function retake() {
    setFile(null);
    setPreview(null);
    setCameraOpen(true);
  }

  async function submit() {
    if (!file) {
      setCameraOpen(true);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      if (bodyZone) fd.append("body_area", bodyZone);
      const res = await fetch("/api/scans", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || t.scan.uploadFailed);
      }
      const j = await res.json();
      router.push(`/moles/${j.id}`);
      router.refresh();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? t.scan.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  // ── Step: zone selection ────────────────────────────────────────────────
  if (step === "zone") {
    return (
      <div className="h-screen w-screen flex flex-col bg-[#0c0e13] text-white overflow-hidden">

        {/* Header */}
        <header className="flex-shrink-0 flex justify-between items-center px-4 pt-14 pb-3 z-10">
          <button
            onClick={() => setStep("scan")}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Icon name="close" />
          </button>

          <div className="text-center">
            <h1 className="text-sm font-semibold text-white">{t.scan.selectZone}</h1>
            <p className="text-white/40 text-[11px]">{t.scan.selectZoneHint}</p>
          </div>

          {/* Gender toggle */}
          <div className="flex bg-white/10 rounded-full p-0.5 gap-0.5">
            <button
              onClick={() => { setGender("male"); setBodyZone(null); }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                gender === "male" ? "bg-white text-[#0c0e13]" : "text-white/50"
              }`}
            >
              ♂
            </button>
            <button
              onClick={() => { setGender("female"); setBodyZone(null); }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                gender === "female" ? "bg-white text-[#0c0e13]" : "text-white/50"
              }`}
            >
              ♀
            </button>
          </div>
        </header>

        {/* Middle: sidebars + 3D model */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* Left sidebar — torso / head zones */}
          <aside className="w-[62px] flex-shrink-0 flex flex-col gap-1 py-1 px-1 overflow-y-auto">
            {TORSO_ZONE_IDS.map((id) => {
              const active = bodyZone === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (active) { setBodyZone(null); }
                    else { setBodyZone(id); setStep("scan"); }
                  }}
                  className={`w-full py-1.5 rounded-lg text-[10px] font-medium leading-tight text-center transition-all active:scale-95 ${
                    active
                      ? "bg-emerald-500/25 border border-emerald-500/60 text-emerald-400"
                      : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80"
                  }`}
                >
                  {ZONE_INFO[id].short}
                </button>
              );
            })}
          </aside>

          {/* 3D model canvas */}
          <div className="flex-1 relative min-w-0">
            <Suspense
              fallback={
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <span className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-white/30 text-[11px]">{t.common.loading}</p>
                </div>
              }
            >
              <BodyMap3D
                gender={gender}
                selectedZone={bodyZone}
                onZoneSelect={(z) => {
                  if (bodyZone === z) { setBodyZone(null); }
                  else { setBodyZone(z); setStep("scan"); }
                }}
              />
            </Suspense>
          </div>

          {/* Right sidebar — limb zones (L/R pairs) */}
          <aside className="w-[62px] flex-shrink-0 flex flex-col gap-1 py-1 px-1 overflow-y-auto">
            {LIMB_ZONE_IDS.map((id) => {
              const active = bodyZone === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (active) { setBodyZone(null); }
                    else { setBodyZone(id); setStep("scan"); }
                  }}
                  className={`w-full py-1.5 rounded-lg text-[10px] font-medium leading-tight text-center transition-all active:scale-95 ${
                    active
                      ? "bg-emerald-500/25 border border-emerald-500/60 text-emerald-400"
                      : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80"
                  }`}
                >
                  {ZONE_INFO[id].short}
                </button>
              );
            })}
          </aside>
        </div>

        {/* Bottom hint — tapping any zone auto-returns */}
        <div className="flex-shrink-0 bg-[#1a1b20] rounded-t-[2rem] px-5 pt-3 pb-8 flex items-center justify-center">
          <p className="text-white/25 text-[11px] text-center">
            {bodyZone
              ? `✓ ${ZONE_INFO[bodyZone].labelRu} — ${t.common.continue}`
              : t.scan.selectZoneHint}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* In-app camera overlay */}
      {cameraOpen && (
        <ScanCamera
          onCapture={handleCapture}
          onClose={() => setCameraOpen(false)}
        />
      )}

      <div className="h-screen w-screen flex flex-col relative bg-[#0c0e13] text-white overflow-hidden">

        {/* Background: preview image or dark gradient */}
        <div className="absolute inset-0 z-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1a1d2e] via-[#111318] to-[#0c0e13]" />
          )}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Header */}
        <header className="relative z-50 flex justify-between items-center w-full px-5 py-4 pt-14">
          <Link
            href="/home"
            className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white shadow-ambient active:scale-95 transition-transform"
          >
            <Icon name="close" />
          </Link>

          <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md">
            <span className="text-white/60 text-xs font-medium tracking-wide uppercase">SkinX Scan</span>
          </div>

          {/* Retake button — only shown when preview exists */}
          {preview ? (
            <button
              onClick={retake}
              className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white active:scale-95 transition-transform"
              aria-label="Retake"
            >
              <Icon name="refresh" />
            </button>
          ) : (
            <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white/40">
              <Icon name="info" />
            </div>
          )}
        </header>

        {/* Viewfinder / preview area */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          {/* Frame with corners */}
          <div className="w-64 h-64 rounded-[2rem] relative flex items-center justify-center mb-10">
            <div className="absolute top-0 left-0 w-9 h-9 border-t-[3px] border-l-[3px] border-white/40 rounded-tl-[2rem]" />
            <div className="absolute top-0 right-0 w-9 h-9 border-t-[3px] border-r-[3px] border-white/40 rounded-tr-[2rem]" />
            <div className="absolute bottom-0 left-0 w-9 h-9 border-b-[3px] border-l-[3px] border-white/40 rounded-bl-[2rem]" />
            <div className="absolute bottom-0 right-0 w-9 h-9 border-b-[3px] border-r-[3px] border-white/40 rounded-br-[2rem]" />

            {!preview && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: "2rem" }}>
                <div className="animate-scan-sweep bg-white/30 shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              </div>
            )}

            {/* Center icon when no preview */}
            {!preview && (
              <button
                onClick={() => setCameraOpen(true)}
                className="flex flex-col items-center gap-3 active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <Icon name="photo_camera" filled className="text-white/70 text-3xl" />
                </div>
                <span className="text-white/50 text-xs font-medium">{t.scan.openCamera}</span>
              </button>
            )}
          </div>

          {/* Status chip */}
          <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-ambient">
            <Icon
              name={preview ? "check_circle" : "photo_camera"}
              filled={!!preview}
              className={`text-sm ${preview ? "text-emerald-400" : "text-white/40"}`}
            />
            <span className="text-sm font-medium text-white/80">
              {preview ? t.scan.imageReady : t.scan.holdSteady}
            </span>
          </div>
        </main>

        {/* Bottom sheet */}
        <div className="relative z-50 w-full bg-[#1a1b20] rounded-t-[2rem] shadow-ambient-xl px-5 py-6 pb-10 flex flex-col gap-5 text-white">
          <div className="w-10 h-1 bg-white/10 rounded-full mx-auto -mt-2 mb-1" />

          {/* Hidden file input for gallery selection */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
          />

          {/* Zone selector button */}
          <button
            onClick={() => setStep("zone")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all active:scale-[0.98] ${
              bodyZone
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-white/[0.06] border-white/10 text-white/50"
            }`}
          >
            <span className="text-lg">🗺️</span>
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold leading-none">
                {bodyZone ? ZONE_INFO[bodyZone].labelRu : t.scan.selectZone}
              </p>
              <p className={`text-[10px] mt-0.5 ${bodyZone ? "text-emerald-400/60" : "text-white/25"}`}>
                {bodyZone ? t.scan.selectZoneHint : "Нажмите чтобы выбрать зону в 3D"}
              </p>
            </div>
            <span className={`text-xs ${bodyZone ? "text-emerald-400/60" : "text-white/20"}`}>›</span>
          </button>

          {/* Main action row */}
          <div className="flex items-center justify-between px-2">
            {/* Gallery picker */}
            <button
              onClick={openGallery}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-[72px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/[0.08] flex items-center justify-center">
                <Icon name="folder_open" className="text-white/60" />
              </div>
              <span className="text-white/40 text-[10px] font-medium text-center leading-tight">{t.scan.chooseFromLibrary}</span>
            </button>

            {/* Primary shutter / submit button */}
            <button
              onClick={() => {
                if (!file && !bodyZone) { setStep("zone"); return; }
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

            {/* Retake / placeholder — mirrors gallery button for symmetry */}
            {file ? (
              <button
                onClick={retake}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-[72px]"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/[0.08] flex items-center justify-center">
                  <Icon name="refresh" className="text-white/60" />
                </div>
                <span className="text-white/40 text-[10px] font-medium text-center leading-tight">Retake</span>
              </button>
            ) : (
              <div className="w-[72px]" />
            )}
          </div>

          {error ? (
            <p className="text-red-400 text-xs text-center font-medium">{error}</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
