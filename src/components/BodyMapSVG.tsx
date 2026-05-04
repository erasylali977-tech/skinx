"use client";
import { useState } from "react";
import type { ImageZoneId } from "@/lib/zoneDetails";
import { useI18n } from "@/lib/i18n/context";

type Side   = "front" | "back";
type Gender = "male" | "female";
type L      = "ru" | "en" | "kk";
type Label  = Record<L, string>;

interface ZoneDef {
  id:    string;
  el:    "circle" | "ellipse" | "rect" | "path";
  a:     Record<string, string | number>;
  zone:  { front: ImageZoneId; back: ImageZoneId };
  label: { front: Label; back: Label };
  normX: number;
  normY: number;
}

// SVG zones — viewBox "0 0 100 150"
// Figure sits at roughly x: 34-66%, y: 5-92% of the container.
// Arms hang outside torso: left arm x≈28-36, right arm x≈64-72.
const BASE_ZONES: ZoneDef[] = [
  // ── Head & neck ────────────────────────────────────────────────────────────
  { id: "head",
    el: "circle", a: { cx: 50, cy: 14, r: 7.5 },
    zone:  { front: "face",    back: "face"    },
    label: { front: { ru: "Голова / Лицо",  en: "Head / Face",   kk: "Бас / Бет"       },
             back:  { ru: "Голова",          en: "Head",          kk: "Бас"             } },
    normX: 0.50, normY: 0.093 },

  { id: "neck",
    el: "ellipse", a: { cx: 50, cy: 26, rx: 4.5, ry: 3 },
    zone:  { front: "neck",    back: "neck"    },
    label: { front: { ru: "Шея",  en: "Neck",  kk: "Мойын" },
             back:  { ru: "Шея",  en: "Neck",  kk: "Мойын" } },
    normX: 0.50, normY: 0.173 },

  // ── Upper arms (shoulder to elbow) — cx ≈ 32 / 68, cy ≈ 36 ────────────────
  { id: "uarm_l",
    el: "ellipse", a: { cx: 68, cy: 37, rx: 5.5, ry: 10 },
    zone:  { front: "arms", back: "arms" },
    label: { front: { ru: "Левое плечо",  en: "Left shoulder",  kk: "Сол иық" },
             back:  { ru: "Левое плечо",  en: "Left shoulder",  kk: "Сол иық" } },
    normX: 0.68, normY: 0.247 },

  { id: "uarm_r",
    el: "ellipse", a: { cx: 32, cy: 37, rx: 5.5, ry: 10 },
    zone:  { front: "arms", back: "arms" },
    label: { front: { ru: "Правое плечо", en: "Right shoulder", kk: "Оң иық"  },
             back:  { ru: "Правое плечо", en: "Right shoulder", kk: "Оң иық"  } },
    normX: 0.32, normY: 0.247 },

  // ── Chest — only pectoral area y≈27-46 ────────────────────────────────────
  { id: "chest",
    el: "path", a: { d: "M37,31 Q51,29 63,31 L61,48 L39,48 Z" },
    zone:  { front: "chest",   back: "back"    },
    label: { front: { ru: "Грудь",         en: "Chest",      kk: "Кеуде"        },
             back:  { ru: "Верхняя спина", en: "Upper back", kk: "Жоғарғы арқа" } },
    normX: 0.51, normY: 0.260 },

  // ── Abdomen — navel area y≈47-63 ──────────────────────────────────────────
  { id: "abdomen",
    el: "rect", a: { x: 39, y: 47, width: 22, height: 16, rx: 2 },
    zone:  { front: "abdomen", back: "back"    },
    label: { front: { ru: "Живот",  en: "Abdomen",  kk: "Іш"   },
             back:  { ru: "Спина",  en: "Mid back", kk: "Арқа" } },
    normX: 0.50, normY: 0.367 },

  // ── Pelvis / hips y≈63-80 ─────────────────────────────────────────────────
  { id: "pelvis",
    el: "path", a: { d: "M39,63 L61,63 L64,80 L36,80 Z" },
    zone:  { front: "abdomen", back: "back"    },
    label: { front: { ru: "Таз / Бёдра", en: "Pelvis / Hips", kk: "Жамбас"  },
             back:  { ru: "Поясница",    en: "Lower back",    kk: "Бел"     } },
    normX: 0.50, normY: 0.477 },

  // ── Forearms (elbow to wrist) — cx ≈ 29 / 71, cy ≈ 55 ────────────────────
  { id: "farm_l",
    el: "ellipse", a: { cx: 71, cy: 62, rx: 5.5, ry: 11 },
    zone:  { front: "arms", back: "arms" },
    label: { front: { ru: "Левое предплечье",  en: "Left forearm",  kk: "Сол білек" },
             back:  { ru: "Левое предплечье",  en: "Left forearm",  kk: "Сол білек" } },
    normX: 0.71, normY: 0.413 },

  { id: "farm_r",
    el: "ellipse", a: { cx: 29, cy: 62, rx: 5.5, ry: 11 },
    zone:  { front: "arms", back: "arms" },
    label: { front: { ru: "Правое предплечье", en: "Right forearm", kk: "Оң білек"  },
             back:  { ru: "Правое предплечье", en: "Right forearm", kk: "Оң білек"  } },
    normX: 0.29, normY: 0.413 },

  // ── Hands — cx ≈ 28 / 72, cy ≈ 72 ────────────────────────────────────────
  { id: "hand_l",
    el: "ellipse", a: { cx: 76, cy: 85, rx: 6, ry: 6.5 },
    zone:  { front: "arms", back: "arms" },
    label: { front: { ru: "Левая кисть",  en: "Left hand",  kk: "Сол қол" },
             back:  { ru: "Левая кисть",  en: "Left hand",  kk: "Сол қол" } },
    normX: 0.76, normY: 0.567 },

  { id: "hand_r",
    el: "ellipse", a: { cx: 24, cy: 85, rx: 6, ry: 6.5 },
    zone:  { front: "arms", back: "arms" },
    label: { front: { ru: "Правая кисть", en: "Right hand", kk: "Оң қол"  },
             back:  { ru: "Правая кисть", en: "Right hand", kk: "Оң қол"  } },
    normX: 0.24, normY: 0.567 },

  // ── Thighs — y≈80-103 ─────────────────────────────────────────────────────
  { id: "thigh_l",
    el: "ellipse", a: { cx: 57, cy: 92, rx: 9, ry: 11 },
    zone:  { front: "legs", back: "legs" },
    label: { front: { ru: "Левое бедро",  en: "Left thigh",  kk: "Сол сан" },
             back:  { ru: "Левое бедро",  en: "Left thigh",  kk: "Сол сан" } },
    normX: 0.57, normY: 0.613 },

  { id: "thigh_r",
    el: "ellipse", a: { cx: 43, cy: 92, rx: 9, ry: 11 },
    zone:  { front: "legs", back: "legs" },
    label: { front: { ru: "Правое бедро", en: "Right thigh", kk: "Оң сан"  },
             back:  { ru: "Правое бедро", en: "Right thigh", kk: "Оң сан"  } },
    normX: 0.43, normY: 0.613 },

  // ── Shins — y≈103-125 ─────────────────────────────────────────────────────
  { id: "shin_l",
    el: "ellipse", a: { cx: 58, cy: 121, rx: 7.5, ry: 10 },
    zone:  { front: "legs", back: "legs" },
    label: { front: { ru: "Левая голень",  en: "Left shin",  kk: "Сол балтыр" },
             back:  { ru: "Левая голень",  en: "Left shin",  kk: "Сол балтыр" } },
    normX: 0.58, normY: 0.807 },

  { id: "shin_r",
    el: "ellipse", a: { cx: 42, cy: 121, rx: 7.5, ry: 10 },
    zone:  { front: "legs", back: "legs" },
    label: { front: { ru: "Правая голень", en: "Right shin", kk: "Оң балтыр"  },
             back:  { ru: "Правая голень", en: "Right shin", kk: "Оң балтыр"  } },
    normX: 0.42, normY: 0.807 },

  // ── Feet — y≈126-135 ──────────────────────────────────────────────────────
  { id: "foot_l",
    el: "ellipse", a: { cx: 59, cy: 138, rx: 9, ry: 5 },
    zone:  { front: "feet", back: "feet" },
    label: { front: { ru: "Левая стопа",  en: "Left foot",  kk: "Сол табан" },
             back:  { ru: "Левая стопа",  en: "Left foot",  kk: "Сол табан" } },
    normX: 0.59, normY: 0.92 },

  { id: "foot_r",
    el: "ellipse", a: { cx: 41, cy: 138, rx: 9, ry: 5 },
    zone:  { front: "feet", back: "feet" },
    label: { front: { ru: "Правая стопа", en: "Right foot", kk: "Оң табан" },
             back:  { ru: "Правая стопа", en: "Right foot", kk: "Оң табан" } },
    normX: 0.41, normY: 0.92 },
];

const FEMALE_OV: Record<string, Partial<Record<string, string | number>>> = {
  uarm_l:  { cx: 67, cy: 36, rx: 5,  ry: 9 },
  uarm_r:  { cx: 33, cy: 36, rx: 5,  ry: 9 },
  chest:   { d: "M38,31 Q51,29 62,31 L60,48 L40,48 Z" },
  pelvis:  { d: "M37,63 L63,63 L67,80 L33,80 Z" },
  thigh_l: { cx: 58, cy: 92, rx: 10.5, ry: 11 },
  thigh_r: { cx: 42, cy: 92, rx: 10.5, ry: 11 },
};

function getZones(gender: Gender): ZoneDef[] {
  if (gender === "male") return BASE_ZONES;
  return BASE_ZONES.map((z) => {
    const ov = FEMALE_OV[z.id];
    if (!ov) return z;
    const merged = Object.fromEntries(
      Object.entries({ ...z.a, ...ov }).filter(([, v]) => v !== undefined)
    ) as Record<string, string | number>;
    return { ...z, a: merged };
  });
}

function ZoneShape({ z, selected, onClick }: {
  z: ZoneDef; selected: boolean; onClick: () => void;
}) {
  const { el, a } = z;
  const p = {
    fill:        selected ? "rgba(93,154,245,0.35)" : "transparent",
    stroke:      selected ? "#5b9af5"               : "transparent",
    strokeWidth: selected ? 2 : 0,
    style: {
      cursor:     "pointer",
      transition: "fill 0.15s, stroke 0.15s",
      filter:     selected ? "drop-shadow(0 0 8px rgba(93,154,245,0.65))" : "none",
    } as React.CSSProperties,
    onClick,
  };
  if (el === "circle")  return <circle  {...(a as React.SVGProps<SVGCircleElement>)}  {...p} />;
  if (el === "ellipse") return <ellipse {...(a as React.SVGProps<SVGEllipseElement>)} {...p} />;
  if (el === "rect")    return <rect    {...(a as React.SVGProps<SVGRectElement>)}    {...p} />;
  return                       <path    {...(a as React.SVGProps<SVGPathElement>)}    {...p} />;
}

const T = {
  title:    { ru: "Выберите зону",           en: "Select zone",     kk: "Аймақты таңдаңыз"      },
  hint:     { ru: "Тапните на участок тела", en: "Tap a body part", kk: "Дене бөлігіне басыңыз" },
  front:    { ru: "Перед",                   en: "Front",           kk: "Алды"                  },
  back:     { ru: "Спина",                   en: "Back",            kk: "Арты"                  },
  skip:     { ru: "Пропустить",              en: "Skip",            kk: "Өткізіп жіберу"        },
  selected: { ru: "Выбрана зона",            en: "Selected zone",   kk: "Таңдалған аймақ"       },
  confirm:  { ru: "Продолжить →",            en: "Continue →",      kk: "Жалғастыру →"          },
  change:   { ru: "Изменить зону",           en: "Change zone",     kk: "Аймақты өзгерту"       },
} as const;

interface Props {
  gender:   "male" | "female";
  onSelect: (zone: ImageZoneId, normX: number, normY: number, side: Side) => void;
  onSkip:   () => void;
}

export function BodyMapSVG({ gender, onSelect, onSkip }: Props) {
  const { locale } = useI18n();
  const l = locale as L;

  const [side,    setSide]    = useState<Side>("front");
  const [pending, setPending] = useState<ZoneDef | null>(null);

  const zones = getZones(gender);

  function handleConfirm() {
    if (!pending) return;
    onSelect(pending.zone[side], pending.normX, pending.normY, side);
    setPending(null);
  }

  return (
    <div className="relative flex flex-col h-full select-none overflow-hidden">

      {/* Title */}
      <div className="px-5 pt-2 pb-1 flex-shrink-0">
        <h2 className="text-[20px] font-black tracking-tight">{T.title[l]}</h2>
        <p className="text-on-surface-variant text-sm mt-0.5">{T.hint[l]}</p>
      </div>

      {/* Front / Back toggle */}
      <div className="flex-shrink-0 flex justify-center px-5 pb-2">
        <div className="flex bg-surface-container rounded-2xl p-1 gap-1 w-full max-w-[280px]">
          {(["front", "back"] as Side[]).map((s) => (
            <button
              key={s}
              onClick={() => { setSide(s); setPending(null); }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                side === s ? "bg-primary text-white shadow-sm" : "text-on-surface-variant"
              }`}
            >
              {s === "front" ? T.front[l] : T.back[l]}
            </button>
          ))}
        </div>
      </div>

      {/* Body image + SVG overlay */}
      <div className="flex-1 flex items-center justify-center min-h-0 px-4">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ height: "100%", aspectRatio: "3/5", maxHeight: "100%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={`${gender}-${side}`}
            src={`/assets/body/${gender}-${side}.jpg`}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          />

          {/* Transparent SVG hit zones — back view is horizontally mirrored */}
          <svg
            viewBox="0 0 100 150"
            className="absolute inset-0 w-full h-full"
            style={{ touchAction: "none" }}
          >
            <g transform={side === "back" ? "scale(-1,1) translate(-100,0)" : undefined}>
              {zones.map((z) => (
                <ZoneShape
                  key={z.id}
                  z={z}
                  selected={pending?.id === z.id}
                  onClick={() => setPending(z)}
                />
              ))}
            </g>
          </svg>
        </div>
      </div>

      {/* ── Compact in-flow confirmation bar (no overlay → legs stay visible) ── */}
      <div
        className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-out ${
          pending ? "max-h-[72px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-4 mb-2 bg-surface-container rounded-2xl px-4 py-3 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant leading-none">
              {T.selected[l]}
            </p>
            <p className="text-[14px] font-black text-on-surface truncate leading-tight">
              {pending?.label[side][l] ?? ""}
            </p>
          </div>
          <button
            onClick={() => setPending(null)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs text-on-surface-variant font-semibold active:scale-95 transition-transform"
          >
            {T.change[l]}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-primary text-white text-sm font-black shadow-sm active:scale-95 transition-all"
          >
            {T.confirm[l]}
          </button>
        </div>
      </div>

      {/* Skip */}
      <div className="flex-shrink-0 px-5 pb-4">
        <button
          onClick={onSkip}
          className="w-full py-2.5 text-on-surface-variant text-sm font-semibold active:scale-[0.98] transition-transform"
        >
          {T.skip[l]}
        </button>
      </div>
    </div>
  );
}
