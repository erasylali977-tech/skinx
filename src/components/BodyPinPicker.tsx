"use client";
import { useState } from "react";
import type { ImageZoneId } from "@/lib/zoneDetails";
import { useI18n } from "@/lib/i18n/context";

// ── Types ─────────────────────────────────────────────────────────────────────
type BodySide = "front" | "back";
type L = "ru" | "en" | "kk";
type Label = Record<L, string>;

type EllipseShape = { type: "e"; cx: number; cy: number; rx: number; ry: number };
type RectShape    = { type: "r"; x: number;  y: number;  w: number;  h: number; r: number };

interface Seg {
  id: string;
  shape: EllipseShape | RectShape;
  zone: { front: ImageZoneId; back: ImageZoneId };
  label: { front: Label; back: Label };
  /** normalised centre for dot-map (0-1) */
  normX: number;
  normY: number;
}

// ── Segment definitions (viewBox 0 0 100 200) ────────────────────────────────
const SEG: Seg[] = [
  // ── Head
  { id: "head",
    shape: { type: "e", cx: 50, cy: 14, rx: 11, ry: 13 },
    zone: { front: "face", back: "face" },
    label: { front: { ru: "Голова / Лицо", en: "Head / Face", kk: "Бас / Бет" },
             back:  { ru: "Голова",         en: "Head",        kk: "Бас" } },
    normX: 0.50, normY: 0.07 },

  // ── Neck
  { id: "neck",
    shape: { type: "e", cx: 50, cy: 30, rx: 5, ry: 5 },
    zone: { front: "neck", back: "neck" },
    label: { front: { ru: "Шея", en: "Neck", kk: "Мойын" },
             back:  { ru: "Шея", en: "Neck", kk: "Мойын" } },
    normX: 0.50, normY: 0.15 },

  // ── Torso top (chest / upper-back)
  { id: "chest",
    shape: { type: "r", x: 34, y: 36, w: 32, h: 21, r: 8 },
    zone: { front: "chest", back: "back" },
    label: { front: { ru: "Грудь",         en: "Chest",      kk: "Кеуде" },
             back:  { ru: "Верхняя спина",  en: "Upper back", kk: "Жоғарғы арқа" } },
    normX: 0.50, normY: 0.29 },

  // ── Torso mid (abdomen / mid-back)
  { id: "abdomen",
    shape: { type: "r", x: 35, y: 60, w: 30, h: 19, r: 8 },
    zone: { front: "abdomen", back: "back" },
    label: { front: { ru: "Живот",    en: "Abdomen",    kk: "Іш" },
             back:  { ru: "Спина",    en: "Mid back",   kk: "Арқа" } },
    normX: 0.50, normY: 0.40 },

  // ── Hips (pelvis / lower-back)
  { id: "hips",
    shape: { type: "r", x: 31, y: 82, w: 38, h: 17, r: 8 },
    zone: { front: "abdomen", back: "back" },
    label: { front: { ru: "Таз / Бёдра", en: "Pelvis / Hips", kk: "Жамбас" },
             back:  { ru: "Поясница",    en: "Lower back",    kk: "Бел" } },
    normX: 0.50, normY: 0.51 },

  // ── Left upper arm
  { id: "uarm_l",
    shape: { type: "e", cx: 18, cy: 48, rx: 9, ry: 18 },
    zone: { front: "arms", back: "arms" },
    label: { front: { ru: "Левое плечо",  en: "Left shoulder",   kk: "Сол иық" },
             back:  { ru: "Левое плечо",  en: "Left shoulder",   kk: "Сол иық" } },
    normX: 0.18, normY: 0.24 },

  // ── Right upper arm
  { id: "uarm_r",
    shape: { type: "e", cx: 82, cy: 48, rx: 9, ry: 18 },
    zone: { front: "arms", back: "arms" },
    label: { front: { ru: "Правое плечо", en: "Right shoulder",  kk: "Оң иық" },
             back:  { ru: "Правое плечо", en: "Right shoulder",  kk: "Оң иық" } },
    normX: 0.82, normY: 0.24 },

  // ── Left forearm
  { id: "farm_l",
    shape: { type: "e", cx: 14, cy: 78, rx: 7, ry: 15 },
    zone: { front: "arms", back: "arms" },
    label: { front: { ru: "Левое предплечье", en: "Left forearm", kk: "Сол білек" },
             back:  { ru: "Левое предплечье", en: "Left forearm", kk: "Сол білек" } },
    normX: 0.14, normY: 0.40 },

  // ── Right forearm
  { id: "farm_r",
    shape: { type: "e", cx: 86, cy: 78, rx: 7, ry: 15 },
    zone: { front: "arms", back: "arms" },
    label: { front: { ru: "Правое предплечье", en: "Right forearm", kk: "Оң білек" },
             back:  { ru: "Правое предплечье", en: "Right forearm", kk: "Оң білек" } },
    normX: 0.86, normY: 0.40 },

  // ── Left hand
  { id: "hand_l",
    shape: { type: "e", cx: 12, cy: 101, rx: 6, ry: 7 },
    zone: { front: "arms", back: "arms" },
    label: { front: { ru: "Левая кисть", en: "Left hand", kk: "Сол қол" },
             back:  { ru: "Левая кисть", en: "Left hand", kk: "Сол қол" } },
    normX: 0.12, normY: 0.51 },

  // ── Right hand
  { id: "hand_r",
    shape: { type: "e", cx: 88, cy: 101, rx: 6, ry: 7 },
    zone: { front: "arms", back: "arms" },
    label: { front: { ru: "Правая кисть", en: "Right hand", kk: "Оң қол" },
             back:  { ru: "Правая кисть", en: "Right hand", kk: "Оң қол" } },
    normX: 0.88, normY: 0.51 },

  // ── Left thigh
  { id: "thigh_l",
    shape: { type: "e", cx: 37, cy: 123, rx: 10, ry: 18 },
    zone: { front: "legs", back: "legs" },
    label: { front: { ru: "Левое бедро", en: "Left thigh", kk: "Сол сан" },
             back:  { ru: "Левое бедро", en: "Left thigh", kk: "Сол сан" } },
    normX: 0.37, normY: 0.62 },

  // ── Right thigh
  { id: "thigh_r",
    shape: { type: "e", cx: 63, cy: 123, rx: 10, ry: 18 },
    zone: { front: "legs", back: "legs" },
    label: { front: { ru: "Правое бедро", en: "Right thigh", kk: "Оң сан" },
             back:  { ru: "Правое бедро", en: "Right thigh", kk: "Оң сан" } },
    normX: 0.63, normY: 0.62 },

  // ── Left shin
  { id: "shin_l",
    shape: { type: "e", cx: 37, cy: 158, rx: 8, ry: 15 },
    zone: { front: "legs", back: "legs" },
    label: { front: { ru: "Левая голень", en: "Left shin", kk: "Сол балтыр" },
             back:  { ru: "Левая голень", en: "Left shin", kk: "Сол балтыр" } },
    normX: 0.37, normY: 0.79 },

  // ── Right shin
  { id: "shin_r",
    shape: { type: "e", cx: 63, cy: 158, rx: 8, ry: 15 },
    zone: { front: "legs", back: "legs" },
    label: { front: { ru: "Правая голень", en: "Right shin", kk: "Оң балтыр" },
             back:  { ru: "Правая голень", en: "Right shin", kk: "Оң балтыр" } },
    normX: 0.63, normY: 0.79 },

  // ── Left foot
  { id: "foot_l",
    shape: { type: "e", cx: 37, cy: 181, rx: 9, ry: 7 },
    zone: { front: "feet", back: "feet" },
    label: { front: { ru: "Левая стопа", en: "Left foot", kk: "Сол табан" },
             back:  { ru: "Левая стопа", en: "Left foot", kk: "Сол табан" } },
    normX: 0.37, normY: 0.91 },

  // ── Right foot
  { id: "foot_r",
    shape: { type: "e", cx: 63, cy: 181, rx: 9, ry: 7 },
    zone: { front: "feet", back: "feet" },
    label: { front: { ru: "Правая стопа", en: "Right foot", kk: "Оң табан" },
             back:  { ru: "Правая стопа", en: "Right foot", kk: "Оң табан" } },
    normX: 0.63, normY: 0.91 },
];

// ── SVG segment renderer ─────────────────────────────────────────────────────
function SegmentShape({
  seg, selected,
  onClick,
}: {
  seg: Seg;
  selected: boolean;
  onClick: () => void;
}) {
  const s = seg.shape;

  const baseFill    = "var(--color-surface-container-high, #e8edf5)";
  const baseStroke  = "var(--color-outline-variant, #c0c8d8)";
  const selFill     = "rgba(61,122,237,0.18)";
  const selStroke   = "#3d7aed";

  const sharedProps = {
    fill:        selected ? selFill   : baseFill,
    stroke:      selected ? selStroke : baseStroke,
    strokeWidth: selected ? 1.4       : 0.7,
    style:       { cursor: "pointer", transition: "fill 0.15s, stroke 0.15s" } as React.CSSProperties,
    onClick,
  };

  if (s.type === "e") {
    return <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...sharedProps} />;
  }
  return <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} {...sharedProps} />;
}

// ── Front detail overlay (subtle anatomical hints) ────────────────────────────
function FrontDetails() {
  return (
    <g fill="none" strokeWidth="0.6" stroke="var(--color-outline-variant, #c0c8d8)" opacity="0.5">
      <circle cx="46" cy="12" r="1.8" fill="var(--color-outline-variant, #c0c8d8)" />
      <circle cx="54" cy="12" r="1.8" fill="var(--color-outline-variant, #c0c8d8)" />
      <path d="M38,44 Q50,49 62,44" strokeDasharray="2,2" />
      <line x1="50" y1="50" x2="50" y2="78" strokeDasharray="1.5,3" />
      <circle cx="50" cy="87" r="1.6" fill="var(--color-outline-variant, #c0c8d8)" />
    </g>
  );
}

function BackDetails() {
  return (
    <g fill="none" strokeWidth="0.6" stroke="var(--color-outline-variant, #c0c8d8)" opacity="0.5">
      <line x1="50" y1="40" x2="50" y2="96" strokeDasharray="2,3" />
      <path d="M40,52 Q46,60 40,70" />
      <path d="M60,52 Q54,60 60,70" />
    </g>
  );
}

// ── Main exported component ────────────────────────────────────────────────
interface Props {
  onSelect: (zone: ImageZoneId, normX: number, normY: number, side: BodySide) => void;
  onSkip: () => void;
}

export function BodyPinPicker({ onSelect, onSkip }: Props) {
  const { locale } = useI18n();
  const [side, setSide]     = useState<BodySide>("front");
  const [selId, setSelId]   = useState<string | null>(null);

  const l = locale as L;

  const selectedSeg = selId ? SEG.find((s) => s.id === selId) ?? null : null;
  const selectedLabel = selectedSeg?.label[side][l] ?? null;

  const T = {
    title:   { ru: "Выберите зону",          en: "Select zone",          kk: "Аймақты таңдаңыз" },
    hint:    { ru: "Тапните на участок тела", en: "Tap a body segment",   kk: "Дене бөлігіне басыңыз" },
    confirm: { ru: "Продолжить →",            en: "Continue →",           kk: "Жалғастыру →" },
    skip:    { ru: "Пропустить",              en: "Skip",                 kk: "Өткізіп жіберу" },
    front:   { ru: "Перед",                   en: "Front",                kk: "Алды" },
    back:    { ru: "Спина",                   en: "Back",                 kk: "Арты" },
  };

  return (
    <div className="flex flex-col h-full">

      {/* Title */}
      <div className="px-5 pt-2 pb-2 flex-shrink-0">
        <h2 className="text-[20px] font-black tracking-tight">{T.title[l]}</h2>
        <p className="text-on-surface-variant text-sm mt-0.5">{T.hint[l]}</p>
      </div>

      {/* Front / Back toggle */}
      <div className="flex-shrink-0 flex justify-center mb-2">
        <div className="flex bg-surface-container rounded-2xl p-1 gap-1">
          {(["front", "back"] as BodySide[]).map((s) => (
            <button
              key={s}
              onClick={() => { setSide(s); setSelId(null); }}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                side === s
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant"
              }`}
            >
              {s === "front" ? T.front[l] : T.back[l]}
            </button>
          ))}
        </div>
      </div>

      {/* SVG segmented body */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <div className="w-full max-w-[190px]" style={{ aspectRatio: "100/196" }}>
          <svg viewBox="0 0 100 196" className="w-full h-full select-none" style={{ touchAction: "none" }}>
            {SEG.map((seg) => (
              <SegmentShape
                key={seg.id}
                seg={seg}
                selected={selId === seg.id}
                onClick={() => setSelId(seg.id)}
              />
            ))}
            {side === "front" ? <FrontDetails /> : <BackDetails />}
          </svg>
        </div>

        {/* Zone label badge */}
        <div className="mt-3 h-9 flex items-center justify-center">
          <div
            className={`flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 transition-all duration-200 ${
              selectedLabel ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
            <span className="text-primary font-bold text-sm">{selectedLabel ?? ""}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 px-5 pb-6 pt-2 flex flex-col gap-2">
        <button
          onClick={() => {
            if (!selectedSeg) return;
            onSelect(
              selectedSeg.zone[side],
              selectedSeg.normX,
              selectedSeg.normY,
              side,
            );
          }}
          disabled={!selectedSeg}
          className={`w-full py-4 rounded-2xl font-black text-base transition-all duration-200 ${
            selectedSeg
              ? "bg-primary text-white shadow-lg shadow-primary/25 active:scale-[0.98]"
              : "bg-surface-container text-on-surface-variant cursor-not-allowed"
          }`}
        >
          {T.confirm[l]}
        </button>
        <button
          onClick={onSkip}
          className="w-full py-2.5 rounded-2xl text-on-surface-variant text-sm font-semibold active:scale-[0.98] transition-transform"
        >
          {T.skip[l]}
        </button>
      </div>
    </div>
  );
}
