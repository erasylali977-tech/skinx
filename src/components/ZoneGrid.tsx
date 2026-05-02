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
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 w-full">
      {ZONE_DETAILS.map((zone) => (
        <button
          key={zone.id}
          onClick={() => onSelect(zone.id)}
          className="flex flex-col gap-2 text-left active:scale-95 transition-transform duration-150"
        >
          {/* Photo card */}
          <div className="relative w-full rounded-2xl overflow-hidden shadow-ambient"
               style={{ aspectRatio: "3/4" }}>
            <Image
              src={`/assets/images/${gender}/${zone.id}.jpg`}
              alt={zone.name[locale]}
              fill
              className="object-cover object-top"
              sizes="(max-width: 480px) 48vw, 180px"
            />
            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
            {/* zone name chip */}
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex items-end justify-between">
              <span
                className="text-white text-sm font-bold leading-tight"
                style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}
              >
                {zone.name[locale]}
              </span>
              <span className="w-6 h-6 rounded-full bg-emerald-400/90 flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </div>

          {/* Description below card */}
          <p className="text-[11px] leading-relaxed px-0.5 font-medium text-emerald-700 dark:text-emerald-400">
            {zone.description[locale]}
          </p>
        </button>
      ))}
    </div>
  );
}
