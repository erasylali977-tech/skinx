"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const LOCALES: Locale[] = ["en", "ru", "kk"];
const LOCALE_LABELS: Record<Locale, string> = { en: "EN", ru: "RU", kk: "KZ" };

export function AppHeader({ back }: { back?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { locale, setLocale } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30">
      <div className="flex justify-between items-center w-full px-4 py-3 max-w-7xl mx-auto gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {back ? (
            <Link
              href={back}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-low shrink-0"
            >
              <Icon name="arrow_back" className="text-on-surface-variant" />
            </Link>
          ) : (
            <>
              <Icon name="spa" filled className="text-primary text-2xl shrink-0" />
              <Link
                href="/home"
                className="text-xl font-bold tracking-tighter text-on-surface truncate"
              >
                SkinX
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-container transition-colors"
              aria-label="Toggle theme"
            >
              <Icon
                name={resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
                className="text-on-surface-variant text-[20px]"
              />
            </button>
          )}

          <div className="flex bg-surface-container-high rounded-full p-0.5 gap-0.5">
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200",
                  locale === l
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
