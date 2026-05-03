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
          <div className="relative flex items-center justify-center w-28 h-28">
            {/* Focus pulse rings */}
            <div className="logo-focus-ring absolute inset-0 rounded-[32px] bg-primary/30" />
            <div className="logo-focus-ring-delay absolute inset-[-8px] rounded-[36px] bg-primary/15" />
            {/* Logo */}
            <div className="logo-breathe relative w-24 h-24">
              <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                <circle cx="60" cy="60" r="58" fill="#2563eb"/>
                <rect x="16" y="16" width="88" height="88" rx="22" fill="#3d7aed" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
                <circle cx="60" cy="60" r="30" fill="white"/>
                <circle cx="60" cy="60" r="22" fill="#5b8dee"/>
                <circle cx="60" cy="60" r="12" fill="white"/>
                <circle cx="60" cy="60" r="6" fill="#4a7de8"/>
              </svg>
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
