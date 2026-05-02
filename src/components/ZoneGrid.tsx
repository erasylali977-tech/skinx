"use client";
import Image from "next/image";
import { ZONE_DETAILS, type ImageZoneId, type BodyGender } from "@/lib/zoneDetails";
import { useI18n } from "@/lib/i18n/context";

interface Props {
  gender: BodyGender;
  onSelect: (zone: ImageZoneId) => void;
}

export function ZoneGrid({ gender, onSelect }: Props) {
  const { locale } = useI18n();

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {ZONE_DETAILS.map((zone, idx) => (
        <button
          key={zone.id}
          onClick={() => onSelect(zone.id)}
          className={`relative rounded-3xl overflow-hidden active:scale-[0.97] transition-transform duration-150 ${
            idx === 0 ? "col-span-2" : ""
          }`}
          style={{ aspectRatio: idx === 0 ? "21/9" : "3/4" }}
        >
          <Image
            src={`/assets/images/${gender}/${zone.id}.jpg`}
            alt={zone.name[locale]}
            fill
            className="object-cover object-top"
            sizes="(max-width: 480px) 96vw, 380px"
          />

          {/* Rich gradient: transparent top → deep bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Subtle top-right glow accent */}
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />

          {/* Zone name */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-end justify-between">
            <span
              className="text-white font-black leading-tight tracking-tight"
              style={{
                fontSize: idx === 0 ? "22px" : "15px",
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              }}
            >
              {zone.name[locale]}
            </span>

            {/* Arrow chip */}
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2 5.5h7M6 2.5l3 3-3 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
