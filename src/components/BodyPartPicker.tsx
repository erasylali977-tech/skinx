"use client";
import { useState } from "react";
import type { BodyZoneId, BodyGender } from "@/lib/bodyZones";
import { ZONE_INFO } from "@/lib/bodyZones";

interface Props {
  gender?: BodyGender;
  selectedZone: BodyZoneId | null;
  onSelect: (zone: BodyZoneId) => void;
}

const BACK_ZONES: BodyZoneId[] = ["upper_back", "lower_back"];

export function BodyPartPicker({ gender: _gender = "male", selectedZone, onSelect }: Props) {
  const initialSide = selectedZone && BACK_ZONES.includes(selectedZone) ? "back" : "front";
  const [side, setSide] = useState<"front" | "back">(initialSide);

  // Returns SVG props for each zone
  function z(zone: BodyZoneId) {
    const sel = selectedZone === zone;
    return {
      onClick: (e: React.MouseEvent) => { e.stopPropagation(); onSelect(zone); },
      fill: sel ? "rgba(52,211,153,0.25)" : "rgba(148,163,184,0.09)",
      stroke: sel ? "#34d399" : "rgba(148,163,184,0.28)",
      strokeWidth: sel ? 1.5 : 1,
      style: {
        filter: sel ? "drop-shadow(0 0 6px rgba(52,211,153,0.5))" : "none",
        transition: "fill 0.2s ease, stroke 0.2s ease, filter 0.25s ease",
        cursor: "pointer",
      } as React.CSSProperties,
    };
  }

  // Transparent larger hit-area helper
  function h(zone: BodyZoneId) {
    return {
      onClick: (e: React.MouseEvent) => { e.stopPropagation(); onSelect(zone); },
      fill: "transparent",
      stroke: "none",
      style: { cursor: "pointer" } as React.CSSProperties,
    };
  }

  return (
    <div className="flex flex-col items-center w-full gap-4 select-none">

      {/* Front / Back toggle */}
      <div className="flex bg-surface-container rounded-full p-0.5 text-xs font-semibold">
        {(["front", "back"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`px-5 py-2 rounded-full transition-all duration-200 ${
              side === s
                ? "bg-primary text-white shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {s === "front" ? "Перед" : "Спина"}
          </button>
        ))}
      </div>

      {/* SVG Body Map */}
      <div className="relative animate-in fade-in duration-300">
        <svg
          viewBox="0 0 160 285"
          className="w-[200px] h-auto"
          aria-label="Карта тела"
          style={{ overflow: "visible" }}
        >
          {/* ─── HEAD ─── */}
          <ellipse cx="80" cy="24" rx="22" ry="23" {...z("head")} />
          {/* hit area */}
          <ellipse cx="80" cy="24" rx="27" ry="28" {...h("head")} />

          {/* ─── NECK ─── */}
          <rect x="71" y="46" width="18" height="16" rx="6" {...z("neck")} />
          <rect x="67" y="44" width="26" height="20" rx="8" {...h("neck")} />

          {/* ─── SHOULDERS ─── */}
          <ellipse cx="37" cy="74" rx="15" ry="16" {...z("shoulder_L")} />
          <ellipse cx="37" cy="74" rx="20" ry="20" {...h("shoulder_L")} />
          <ellipse cx="123" cy="74" rx="15" ry="16" {...z("shoulder_R")} />
          <ellipse cx="123" cy="74" rx="20" ry="20" {...h("shoulder_R")} />

          {/* ─── UPPER ARMS ─── */}
          <rect x="20" y="88" width="18" height="40" rx="9" {...z("upper_arm_L")} />
          <rect x="16" y="84" width="26" height="48" rx="13" {...h("upper_arm_L")} />
          <rect x="122" y="88" width="18" height="40" rx="9" {...z("upper_arm_R")} />
          <rect x="118" y="84" width="26" height="48" rx="13" {...h("upper_arm_R")} />

          {/* ─── FOREARMS ─── */}
          <rect x="20" y="130" width="18" height="34" rx="9" {...z("forearm_L")} />
          <rect x="15" y="126" width="28" height="42" rx="14" {...h("forearm_L")} />
          <rect x="122" y="130" width="18" height="34" rx="9" {...z("forearm_R")} />
          <rect x="117" y="126" width="28" height="42" rx="14" {...h("forearm_R")} />

          {/* ─── HANDS ─── */}
          <ellipse cx="29" cy="177" rx="13" ry="14" {...z("hand_L")} />
          <ellipse cx="29" cy="177" rx="18" ry="18" {...h("hand_L")} />
          <ellipse cx="131" cy="177" rx="13" ry="14" {...z("hand_R")} />
          <ellipse cx="131" cy="177" rx="18" ry="18" {...h("hand_R")} />

          {/* ─── TORSO (front or back) ─── */}
          {side === "front" ? (
            <>
              <rect x="53" y="60" width="54" height="44" rx="8" {...z("chest")} />
              <rect x="53" y="106" width="54" height="28" rx="6" {...z("abdomen")} />
              <rect x="46" y="136" width="68" height="26" rx="9" {...z("hips")} />
            </>
          ) : (
            <>
              <rect x="53" y="60" width="54" height="44" rx="8" {...z("upper_back")} />
              <rect x="53" y="106" width="54" height="56" rx="6" {...z("lower_back")} />
            </>
          )}

          {/* ─── THIGHS ─── */}
          <rect x="50" y="164" width="27" height="50" rx="10" {...z("thigh_L")} />
          <rect x="46" y="160" width="35" height="58" rx="14" {...h("thigh_L")} />
          <rect x="83" y="164" width="27" height="50" rx="10" {...z("thigh_R")} />
          <rect x="79" y="160" width="35" height="58" rx="14" {...h("thigh_R")} />

          {/* ─── SHINS ─── */}
          <rect x="52" y="216" width="23" height="44" rx="8" {...z("shin_L")} />
          <rect x="48" y="212" width="31" height="52" rx="12" {...h("shin_L")} />
          <rect x="85" y="216" width="23" height="44" rx="8" {...z("shin_R")} />
          <rect x="81" y="212" width="31" height="52" rx="12" {...h("shin_R")} />

          {/* ─── FEET ─── */}
          <ellipse cx="63.5" cy="268" rx="20" ry="11" {...z("foot_L")} />
          <ellipse cx="63.5" cy="268" rx="26" ry="15" {...h("foot_L")} />
          <ellipse cx="96.5" cy="268" rx="20" ry="11" {...z("foot_R")} />
          <ellipse cx="96.5" cy="268" rx="26" ry="15" {...h("foot_R")} />
        </svg>
      </div>

      {/* Zone label */}
      <div className="h-9 flex items-center justify-center">
        {selectedZone ? (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-semibold text-sm">
              {ZONE_INFO[selectedZone].labelRu}
            </span>
          </div>
        ) : (
          <span className="text-on-surface-variant/50 text-xs">
            Нажмите на участок тела
          </span>
        )}
      </div>
    </div>
  );
}
