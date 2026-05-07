"use client";

import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n/context";
import { PostHogProvider } from "./PostHogProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <I18nProvider>{children}</I18nProvider>
      </ThemeProvider>
    </PostHogProvider>
  );
}
