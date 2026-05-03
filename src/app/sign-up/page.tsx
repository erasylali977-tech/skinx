"use client";
import Link from "next/link";
import { SignUpForm } from "./SignUpForm";
import { useI18n } from "@/lib/i18n/context";

export default function SignUpPage() {
  const { t } = useI18n();
  return (
    <div className="bg-white text-gray-900 flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 w-full max-w-md mx-auto">
        <div className="w-full flex flex-col items-center mb-10 space-y-4">
          {/* Animated logo */}
          <div className="relative flex items-center justify-center w-32 h-32">
            {/* Focus pulse rings */}
            <div className="logo-focus-ring absolute inset-0 rounded-[36px] bg-primary/25" />
            <div className="logo-focus-ring-delay absolute inset-[-10px] rounded-[40px] bg-primary/12" />
            {/* MP4 logo loop */}
            <div className="relative w-28 h-28 rounded-[28px] overflow-hidden shadow-primary-glow">
              <video
                src="/icons/logo-anim.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            {t.signUp.title}
          </h1>
          <p className="text-base text-gray-500 font-medium text-center">
            {t.signUp.subtitle}
          </p>
        </div>
        <SignUpForm />
        <p className="text-sm text-gray-500 mt-8 text-center">
          {t.signUp.haveAccount}{" "}
          <Link href="/sign-in" className="text-primary font-bold text-base">
            {t.signUp.signIn}
          </Link>
        </p>
      </main>
    </div>
  );
}
