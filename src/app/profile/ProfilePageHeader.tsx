"use client";
import { useI18n } from "@/lib/i18n/context";

export function ProfilePageHeader() {
  const { t } = useI18n();
  return (
    <>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm font-semibold text-on-surface-variant">
          <span>{t.profile.step1of1}</span>
          <span>{t.profile.yourProfile}</span>
        </div>
        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div className="h-full bg-primary-gradient rounded-full w-full" />
        </div>
      </div>

      <div className="space-y-4 pb-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {t.profile.title}
        </h1>
        <p className="text-lg text-on-surface-variant leading-relaxed">
          {t.profile.subtitle}
        </p>
      </div>
    </>
  );
}
