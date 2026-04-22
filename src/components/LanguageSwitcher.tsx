"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const [lang, setLang] = useState<"EN" | "KZ" | "RU">("EN");
  return (
    <div className="flex bg-surface-container-highest rounded-full p-1 shadow-sm">
      {(["EN", "KZ", "RU"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            "px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200",
            lang === l
              ? "bg-surface-container-lowest text-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
