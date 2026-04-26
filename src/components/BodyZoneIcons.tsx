"use client";
import React from "react";
import type { BodyZoneId } from "@/lib/bodyZones";

// ── Outline SVG shapes, 24×24 viewBox ────────────────────────────────────────
const I: Record<string, React.ReactNode> = {
  head: (
    <>
      <ellipse cx="12" cy="10" rx="6" ry="7" />
      <path d="M9 17 Q9 20 12 20 Q15 20 15 17" />
    </>
  ),
  neck: (
    <>
      <path d="M10 4 L10 18" />
      <path d="M14 4 L14 18" />
      <path d="M10 4 Q12 3 14 4" />
      <path d="M10 18 Q12 21 14 18" />
    </>
  ),
  chest: (
    <>
      <path d="M7 8 L10 4 L14 4 L17 8 L17 19 Q17 21 12 21 Q7 21 7 19Z" />
      <path d="M12 4 L12 21" />
      <path d="M8 12 Q12 14 16 12" />
    </>
  ),
  abdomen: (
    <>
      <path d="M7 4 L17 4 L17 18 Q17 21 12 21 Q7 21 7 18Z" />
      <path d="M12 4 L12 21" />
      <ellipse cx="12" cy="12" rx="1.5" ry="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  upper_back: (
    <>
      <path d="M7 8 L10 4 L14 4 L17 8 L17 19 Q17 21 12 21 Q7 21 7 19Z" />
      <path d="M12 4 L12 21" />
      <path d="M8 11 L16 11" />
      <path d="M8 16 L16 16" />
    </>
  ),
  lower_back: (
    <>
      <path d="M6 4 L18 4 L18 17 Q18 21 12 21 Q6 21 6 17Z" />
      <path d="M10 4 L10 21" />
      <path d="M14 4 L14 21" />
    </>
  ),
  hips: (
    <>
      <path d="M4 5 L20 5 L20 12 Q20 20 12 20 Q4 20 4 12Z" />
      <path d="M12 5 L12 20" />
      <path d="M4 11 Q8 7 12 9 Q16 7 20 11" />
    </>
  ),
  shoulder: (
    <>
      <path d="M7 22 L7 13 Q7 4 12 4 Q17 4 17 13 L17 22" />
      <path d="M7 22 L17 22" />
    </>
  ),
  upper_arm: (
    <>
      <rect x="9" y="2" width="6" height="20" rx="3" />
    </>
  ),
  forearm: (
    <>
      <path d="M10 3 Q14 3 14 7 L14 21 Q14 22 12 22 Q10 22 10 21 L10 3Z" />
    </>
  ),
  hand: (
    <>
      <path d="M8 22 L8 13 Q8 9 12 9 Q16 9 16 13 L16 22Z" />
      <path d="M11 9 L11 5 Q11 4 12 4 Q13 4 13 5 L13 9" />
      <path d="M16 14 L18 10 Q19 8 17 8 Q15.5 8 16 10" />
      <path d="M8 14 L6 10 Q5 8 7 8 Q8.5 8 8 10" />
    </>
  ),
  thigh: (
    <>
      <path d="M8 3 Q16 3 16 9 L15 21 Q15 22 12 22 Q9 22 9 21 L8 3Z" />
    </>
  ),
  shin: (
    <>
      <path d="M9 3 Q15 3 15 7 L13 21 Q13 22 12 22 Q11 22 11 21 L9 3Z" />
    </>
  ),
  foot: (
    <>
      <path d="M6 9 L6 14 Q6 19 10 19 L19 19 Q21 19 21 17 Q21 15 18 15 L14 15 L14 5 Q14 3 12 3 Q10 3 10 5 L10 9Z" />
    </>
  ),
};

const BASE: Record<BodyZoneId, string> = {
  head: "head", neck: "neck", chest: "chest", abdomen: "abdomen",
  upper_back: "upper_back", lower_back: "lower_back", hips: "hips",
  shoulder_L: "shoulder", shoulder_R: "shoulder",
  upper_arm_L: "upper_arm", upper_arm_R: "upper_arm",
  forearm_L: "forearm", forearm_R: "forearm",
  hand_L: "hand", hand_R: "hand",
  thigh_L: "thigh", thigh_R: "thigh",
  shin_L: "shin", shin_R: "shin",
  foot_L: "foot", foot_R: "foot",
};

interface ZoneIconProps {
  zone: BodyZoneId;
  size?: number;
  className?: string;
}

export function ZoneIcon({ zone, size = 28, className }: ZoneIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {I[BASE[zone]]}
    </svg>
  );
}

// ── Human body silhouette for intro illustration ──────────────────────────────
export function BodySilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 220"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Head */}
      <ellipse cx="50" cy="17" rx="14" ry="15" />
      {/* Neck */}
      <path d="M44 31 L44 41 Q50 46 56 41 L56 31" />
      {/* Torso */}
      <path d="M28 41 L22 97 L32 97 L34 148 L66 148 L68 97 L78 97 L72 41 Z" />
      {/* Left arm */}
      <path d="M28 45 L14 86 Q12 92 16 98 L20 112 Q24 118 28 112 L30 98" />
      {/* Right arm */}
      <path d="M72 45 L86 86 Q88 92 84 98 L80 112 Q76 118 72 112 L70 98" />
      {/* Left leg */}
      <path d="M34 148 L28 198 Q32 204 38 198 L44 172" />
      {/* Right leg */}
      <path d="M66 148 L72 198 Q68 204 62 198 L56 172" />
    </svg>
  );
}
