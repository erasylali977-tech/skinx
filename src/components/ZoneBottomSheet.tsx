"use client";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { ZONE_DETAIL_MAP, type ImageZoneId } from "@/lib/zoneDetails";
import { useI18n } from "@/lib/i18n/context";
import type { BodyGender } from "@/lib/bodyZones";

interface Props {
  zone: ImageZoneId;
  gender: BodyGender;
  onGenderChange: (g: BodyGender) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function ZoneBottomSheet({
  zone,
  gender,
  onGenderChange,
  onConfirm,
  onClose,
}: Props) {
  const { locale } = useI18n();
  const detail = ZONE_DETAIL_MAP[zone];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-[2rem] overflow-hidden shadow-2xl animate-slide-up">
        {/* Zone photo */}
        <div className="relative w-full h-[46vw] max-h-52">
          <Image
            src={`/assets/images/${gender}/${zone}.jpg`}
            alt={detail.name[locale]}
            fill
            className="object-cover object-top"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
          >
            <Icon name="close" className="text-white text-sm" />
          </button>

          {/* Gender toggle */}
          <div className="absolute top-3 left-3 flex bg-black/40 backdrop-blur-md rounded-full p-0.5 gap-0.5">
            <button
              onClick={() => onGenderChange("male")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                gender === "male" ? "bg-white text-black" : "text-white/70"
              }`}
            >
              ♂
            </button>
            <button
              onClick={() => onGenderChange("female")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                gender === "female" ? "bg-white text-black" : "text-white/70"
              }`}
            >
              ♀
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-4 pb-10">
          <h2 className="text-xl font-bold">{detail.name[locale]}</h2>
          <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
            {detail.description[locale]}
          </p>

          <button
            onClick={onConfirm}
            className="mt-6 w-full py-4 rounded-2xl font-semibold text-sm text-white bg-primary-gradient shadow-primary-glow active:scale-[0.98] transition-all"
          >
            Начать сканирование →
          </button>
        </div>
      </div>
    </>
  );
}
