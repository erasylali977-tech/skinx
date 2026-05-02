"use client";
import { useState, useRef } from "react";
import type { ImageZoneId } from "@/lib/zoneDetails";
import { useI18n } from "@/lib/i18n/context";

// ── Zone detection from normalised SVG tap coords ─────────────────────────────
// viewBox "0 0 100 240"
type BodySide = "front" | "back";

interface BodyPin {
  svgX: number;
  svgY: number;
  normX: number; // 0-1
  normY: number; // 0-1
  side: BodySide;
  zone: ImageZoneId;
  label: Record<"ru" | "en" | "kk", string>;
}

const ZONE_LABELS: Record<string, Record<"ru" | "en" | "kk", string>> = {
  face:    { ru: "Голова / Лицо",      en: "Head / Face",     kk: "Бас / Бет" },
  neck:    { ru: "Шея",                en: "Neck",            kk: "Мойын" },
  chest_front: { ru: "Грудь",          en: "Chest",           kk: "Кеуде" },
  chest_back:  { ru: "Верхняя спина",  en: "Upper back",      kk: "Жоғарғы арқа" },
  abdomen_front: { ru: "Живот",        en: "Abdomen",         kk: "Іш" },
  abdomen_back:  { ru: "Поясница",     en: "Lower back",      kk: "Бел" },
  arms:    { ru: "Рука",               en: "Arm",             kk: "Қол" },
  legs:    { ru: "Нога",               en: "Leg",             kk: "Аяқ" },
  feet:    { ru: "Стопа",              en: "Foot",            kk: "Табан" },
};

function detectZone(x: number, y: number, side: BodySide): { zone: ImageZoneId; label: Record<"ru"|"en"|"kk", string> } {
  // x, y in SVG viewBox coords (0-100, 0-240)
  if (y < 34)  return { zone: "face",    label: ZONE_LABELS.face };
  if (y < 46)  return { zone: "neck",    label: ZONE_LABELS.neck };
  // arms: outer horizontal bands
  if ((x < 27 || x > 73) && y < 128) return { zone: "arms", label: ZONE_LABELS.arms };
  if (y < 85)  return side === "front"
    ? { zone: "chest",   label: ZONE_LABELS.chest_front }
    : { zone: "back",    label: ZONE_LABELS.chest_back };
  if (y < 128) return side === "front"
    ? { zone: "abdomen", label: ZONE_LABELS.abdomen_front }
    : { zone: "back",    label: ZONE_LABELS.abdomen_back };
  if (y < 155) return { zone: "abdomen", label: { ru: "Бёдра / Таз", en: "Hips / Pelvis", kk: "Жамбас" } };
  if (y < 228) return { zone: "legs",    label: ZONE_LABELS.legs };
  return           { zone: "feet",       label: ZONE_LABELS.feet };
}

// ── SVG body paths (viewBox 0 0 100 240) ────────────────────────────────────
// Same silhouette for front/back – only inner details differ
function BodySVG({ pin, side, onTap }: {
  pin: BodyPin | null;
  side: BodySide;
  onTap: (svgX: number, svgY: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  function handlePointer(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const vbW = 100, vbH = 240;
    const scaleX = vbW / rect.width;
    const scaleY = vbH / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top)  * scaleY;
    onTap(svgX, svgY);
  }

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 240"
      onPointerDown={handlePointer}
      className="w-full h-full select-none cursor-pointer"
      style={{ touchAction: "none" }}
    >
      {/* ── Silhouette fill ── */}
      <g className="fill-surface-container-high stroke-outline-variant" strokeWidth="0.6">
        {/* Head */}
        <ellipse cx="50" cy="19" rx="13" ry="14" />
        {/* Neck */}
        <path d="M44,31 L44,37 Q44,40 50,40 Q56,40 56,37 L56,31 Z" />
        {/* Torso */}
        <path d="M26,42 C22,44 20,52 20,60 L20,118 C20,122 23,126 27,126 L73,126 C77,126 80,122 80,118 L80,60 C80,52 78,44 74,42 Z" />
        {/* Left arm */}
        <path d="M20,62 C16,64 11,74 9,86 L8,116 C7,121 9,126 13,126 L18,126 C22,126 23,121 24,116 L25,84 C26,72 26,64 26,60 Z" />
        {/* Right arm */}
        <path d="M80,62 C84,64 89,74 91,86 L92,116 C93,121 91,126 87,126 L82,126 C78,126 77,121 76,116 L75,84 C74,72 74,64 74,60 Z" />
        {/* Left leg */}
        <path d="M35,124 L33,164 L31,224 C31,228 34,231 38,231 L43,231 C47,231 48,227 48,223 L48,166 Z" />
        {/* Right leg */}
        <path d="M65,124 L67,164 L69,224 C69,228 66,231 62,231 L57,231 C53,231 52,227 52,223 L52,166 Z" />
      </g>

      {/* ── Front details ── */}
      {side === "front" && (
        <g fill="none" strokeWidth="0.7" className="stroke-outline-variant/60">
          {/* Eyes */}
          <circle cx="45" cy="17" r="2" className="fill-outline-variant/30" />
          <circle cx="55" cy="17" r="2" className="fill-outline-variant/30" />
          {/* Collarbone hint */}
          <path d="M34,44 Q50,50 66,44" strokeDasharray="2,2" />
          {/* Chest centre line */}
          <line x1="50" y1="52" x2="50" y2="118" strokeDasharray="1.5,3" opacity="0.4" />
          {/* Navel */}
          <circle cx="50" cy="102" r="1.8" className="fill-outline-variant/30" />
        </g>
      )}

      {/* ── Back details ── */}
      {side === "back" && (
        <g fill="none" strokeWidth="0.7" className="stroke-outline-variant/60">
          {/* Spine */}
          <line x1="50" y1="44" x2="50" y2="118" strokeDasharray="2,3" opacity="0.5" />
          {/* Shoulder blades hint */}
          <path d="M38,56 Q44,62 38,72" opacity="0.4" />
          <path d="M62,56 Q56,62 62,72" opacity="0.4" />
        </g>
      )}

      {/* ── Tapped pin ── */}
      {pin && (
        <g>
          {/* Pulsing outer ring */}
          <circle cx={pin.svgX} cy={pin.svgY} r="9" fill="none"
            className="stroke-primary animate-ping" strokeWidth="1" opacity="0.5" />
          {/* Inner filled dot */}
          <circle cx={pin.svgX} cy={pin.svgY} r="5"
            className="fill-primary stroke-white" strokeWidth="1.5" />
          {/* Crosshair tick top */}
          <line x1={pin.svgX} y1={pin.svgY - 8} x2={pin.svgX} y2={pin.svgY - 5}
            className="stroke-primary" strokeWidth="1.2" strokeLinecap="round" />
          {/* Crosshair tick bottom */}
          <line x1={pin.svgX} y1={pin.svgY + 5} x2={pin.svgX} y2={pin.svgY + 8}
            className="stroke-primary" strokeWidth="1.2" strokeLinecap="round" />
          <line x1={pin.svgX - 8} y1={pin.svgY} x2={pin.svgX - 5} y2={pin.svgY}
            className="stroke-primary" strokeWidth="1.2" strokeLinecap="round" />
          <line x1={pin.svgX + 5} y1={pin.svgY} x2={pin.svgX + 8} y2={pin.svgY}
            className="stroke-primary" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}

      {/* Hint text when no pin */}
      {!pin && (
        <text x="50" y="252" textAnchor="middle" fontSize="5.5"
          className="fill-on-surface-variant" opacity="0.7">
          Tap to mark location
        </text>
      )}
    </svg>
  );
}

// ── Main exported component ────────────────────────────────────────────────
interface Props {
  onSelect: (zone: ImageZoneId, normX: number, normY: number, side: BodySide) => void;
  onSkip: () => void;
}

export function BodyPinPicker({ onSelect, onSkip }: Props) {
  const { locale } = useI18n();
  const [side, setSide]   = useState<BodySide>("front");
  const [pin,  setPin]    = useState<BodyPin | null>(null);

  const l = locale as "ru" | "en" | "kk";

  function handleTap(svgX: number, svgY: number) {
    const { zone, label } = detectZone(svgX, svgY, side);
    setPin({
      svgX, svgY,
      normX: svgX / 100,
      normY: svgY / 240,
      side, zone, label,
    });
  }

  const titles: Record<"ru"|"en"|"kk", string> = {
    ru: "Где образование?",
    en: "Where is the spot?",
    kk: "Дақ қай жерде?",
  };
  const subtitles: Record<"ru"|"en"|"kk", string> = {
    ru: "Нажмите на силуэт",
    en: "Tap the body silhouette",
    kk: "Силуэтке басыңыз",
  };
  const confirmLabels: Record<"ru"|"en"|"kk", string> = {
    ru: "Подтвердить",
    en: "Confirm",
    kk: "Растау",
  };
  const skipLabels: Record<"ru"|"en"|"kk", string> = {
    ru: "Пропустить",
    en: "Skip",
    kk: "Өткізіп жіберу",
  };
  const frontLabels: Record<"ru"|"en"|"kk", string> = {
    ru: "Спереди",
    en: "Front",
    kk: "Алдынан",
  };
  const backLabels: Record<"ru"|"en"|"kk", string> = {
    ru: "Сзади",
    en: "Back",
    kk: "Артынан",
  };

  return (
    <div className="flex flex-col h-full">

      {/* Title */}
      <div className="px-5 pt-2 pb-3 flex-shrink-0">
        <h2 className="text-[22px] font-black tracking-tight">{titles[l]}</h2>
        <p className="text-on-surface-variant text-sm mt-0.5">{subtitles[l]}</p>
      </div>

      {/* Front / Back toggle */}
      <div className="flex-shrink-0 flex justify-center mb-3">
        <div className="flex bg-surface-container rounded-2xl p-1 gap-1">
          {(["front", "back"] as BodySide[]).map((s) => (
            <button
              key={s}
              onClick={() => { setSide(s); setPin(null); }}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                side === s
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant"
              }`}
            >
              {s === "front" ? frontLabels[l] : backLabels[l]}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Body + zone badge */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-8">
        <div className="relative w-full max-w-[200px]" style={{ aspectRatio: "100/255" }}>
          <BodySVG pin={pin} side={side} onTap={handleTap} />
        </div>

        {/* Zone label badge */}
        <div
          className={`mt-4 h-10 flex items-center justify-center transition-all duration-300 ${
            pin ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {pin && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary font-bold text-sm">{pin.label[l]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 px-5 pb-6 pt-3 flex flex-col gap-2.5">
        <button
          onClick={() => pin && onSelect(pin.zone, pin.normX, pin.normY, pin.side)}
          disabled={!pin}
          className={`w-full py-4 rounded-2xl font-black text-base transition-all duration-200 ${
            pin
              ? "bg-primary text-white shadow-lg shadow-primary/30 active:scale-[0.98]"
              : "bg-surface-container text-on-surface-variant cursor-not-allowed"
          }`}
        >
          {confirmLabels[l]}
        </button>
        <button
          onClick={onSkip}
          className="w-full py-3 rounded-2xl text-on-surface-variant text-sm font-semibold active:scale-[0.98] transition-transform"
        >
          {skipLabels[l]}
        </button>
      </div>
    </div>
  );
}
