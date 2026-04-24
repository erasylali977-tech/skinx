"use client";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/context";
import { AppHeader } from "@/components/AppHeader";

export default function WelcomePage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-surface">
      <AppHeader />
      <main className="flex-grow flex flex-col justify-between items-center px-6 pt-24 pb-12 w-full max-w-md mx-auto">
        <div className="flex flex-col items-center mt-16 w-full">
          <div className="w-32 h-32 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-ambient mb-10 relative">
            <span className="absolute inset-0 rounded-full border border-primary/20 animate-pulse-ring" />
            <Icon
              name="document_scanner"
              filled
              className="text-6xl text-primary"
            />
          </div>
          <div className="text-center max-w-sm space-y-6">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface leading-tight">
              SkinX: {t.welcome.headline}.
            </h1>
            <p className="text-lg text-on-surface-variant font-medium leading-relaxed">
              {t.welcome.sub}
            </p>
          </div>
        </div>
        <div className="w-full pb-8 space-y-4">
          <Link
            href="/tutorial"
            className="block w-full py-4 px-8 rounded-full bg-primary-gradient text-on-primary text-lg font-bold tracking-wide shadow-primary-glow hover:opacity-90 active:scale-[0.98] transition-all duration-200 text-center"
          >
            {t.welcome.getStarted}
          </Link>
          <Link
            href="/sign-in"
            className="block text-center text-on-surface-variant hover:text-primary text-sm font-semibold py-2"
          >
            {t.welcome.haveAccount}
          </Link>
        </div>
      </main>
    </div>
  );
}
