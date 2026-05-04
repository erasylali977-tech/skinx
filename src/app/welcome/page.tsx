"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { AppHeader } from "@/components/AppHeader";

export default function WelcomePage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-surface">
      <AppHeader />
      <main className="flex-grow flex flex-col justify-between items-center px-6 pt-24 pb-12 w-full max-w-md mx-auto">
        <div className="flex flex-col items-center mt-8 w-full">
          {/* Logo animation */}
          <div className="relative flex items-center justify-center w-32 h-32 mb-8">
            <div className="logo-focus-ring absolute inset-0 rounded-[36px] bg-primary/25" />
            <div className="logo-focus-ring-delay absolute inset-[-10px] rounded-[40px] bg-primary/12" />
            <div className="relative w-28 h-28 rounded-[28px] overflow-hidden shadow-primary-glow">
              <video src="/icons/logo-anim.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="text-center max-w-sm space-y-3">
            <h1 className="text-5xl font-black tracking-tighter text-on-surface">
              SkinX
            </h1>
            <p className="text-2xl font-black tracking-tight text-on-surface leading-snug">
              {t.welcome.headline}.
            </p>
            <p className="text-base text-on-surface-variant font-medium">
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
