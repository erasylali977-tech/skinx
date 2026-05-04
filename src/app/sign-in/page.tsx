"use client";
import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "./SignInForm";
import { useI18n } from "@/lib/i18n/context";

export default function SignInPage() {
  const { t } = useI18n();
  return (
    <div className="bg-background text-on-surface flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 w-full max-w-md mx-auto">
        <div className="w-full flex flex-col items-center justify-center mb-8 space-y-4">
          <div className="relative flex items-center justify-center w-32 h-32">
            <div className="logo-focus-ring absolute inset-0 rounded-[36px] bg-primary/25" />
            <div className="logo-focus-ring-delay absolute inset-[-10px] rounded-[40px] bg-primary/12" />
            <div className="relative w-28 h-28 rounded-[28px] overflow-hidden shadow-primary-glow">
              <video src="/icons/logo-anim.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">SkinX</h1>
            <p className="text-base text-on-surface-variant font-medium">{t.signIn.subtitle}</p>
          </div>
        </div>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
        <div className="w-full text-center mt-12 pb-4">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {t.signIn.noAccount}{" "}
            <Link href="/sign-up" className="text-primary font-semibold underline-offset-2">
              {t.signIn.signUp}
            </Link>
          </p>
          <p className="text-xs text-on-surface-variant leading-relaxed mt-4">
            {t.signIn.agreePrefix}{" "}
            <Link href="/terms" className="text-on-surface-variant underline decoration-outline-variant underline-offset-2">
              {t.signIn.termsLink}
            </Link>{" "}
            &amp;{" "}
            <Link href="/privacy" className="text-on-surface-variant underline decoration-outline-variant underline-offset-2">
              {t.signIn.privacyLink}
            </Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
