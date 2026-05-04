"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { AppHeader } from "@/components/AppHeader";

export default function WelcomePage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-surface">
      <AppHeader />
      <main className="flex-grow flex flex-col items-center justify-center px-6 pb-6 w-full max-w-md mx-auto">
        {/* Logo animation */}
        <div className="relative flex items-center justify-center w-32 h-32 mb-6">
          <div className="logo-focus-ring absolute inset-0 rounded-[36px] bg-primary/25" />
          <div className="logo-focus-ring-delay absolute inset-[-10px] rounded-[40px] bg-primary/12" />
          <div className="relative w-28 h-28 rounded-[28px] overflow-hidden shadow-primary-glow">
            <video src="/icons/logo-anim.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Brand */}
        <h1 className="text-5xl font-black tracking-tighter text-on-surface mb-3">SkinX</h1>

        {/* Headline — big & beautiful */}
        <p className="text-[28px] font-black tracking-tight text-center leading-[1.15] mb-8 max-w-[300px] bg-gradient-to-br from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
          {t.welcome.headline}
        </p>

        {/* Buttons — right below headline */}
        <div className="w-full space-y-3">
          <Link
            href="/tutorial"
            className="block w-full py-4 px-8 rounded-full bg-primary-gradient text-white text-lg font-bold tracking-wide shadow-primary-glow hover:opacity-90 active:scale-[0.98] transition-all duration-200 text-center"
          >
            {t.welcome.getStarted}
          </Link>
          <Link
            href="/sign-in"
            className="block text-center text-on-surface-variant hover:text-primary text-sm font-semibold py-2 transition-colors"
          >
            {t.welcome.haveAccount}
          </Link>
        </div>
      </main>
    </div>
  );
}
