"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

export function AppHeader({ back }: { back?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30" style={{ paddingTop: "env(safe-area-inset-top)" }}>
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
        </div>
      </div>
    </header>
  );
}
