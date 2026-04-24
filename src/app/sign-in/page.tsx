"use client";
import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "./SignInForm";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/context";

export default function SignInPage() {
  const { t } = useI18n();
  return (
    <div className="bg-white text-gray-900 flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 w-full max-w-md mx-auto">
        <div className="w-full flex flex-col items-center justify-center mb-12 space-y-6">
          <div className="w-20 h-20 rounded-[2rem] bg-gray-100 shadow-sm flex items-center justify-center">
            <Icon name="face_retouching_natural" filled className="text-4xl text-primary" />
          </div>
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary">SkinX</h1>
            <p className="text-base text-gray-500 font-medium">{t.signIn.subtitle}</p>
          </div>
        </div>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
        <div className="w-full text-center mt-12 pb-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            {t.signIn.noAccount}{" "}
            <Link href="/sign-up" className="text-primary font-semibold underline-offset-2">
              {t.signIn.signUp}
            </Link>
          </p>
          <p className="text-xs text-gray-500 leading-relaxed mt-4">
            {t.signIn.agreePrefix}{" "}
            <Link href="/terms" className="text-gray-600 underline decoration-gray-300 underline-offset-2">
              {t.signIn.termsLink}
            </Link>{" "}
            &amp;{" "}
            <Link href="/privacy" className="text-gray-600 underline decoration-gray-300 underline-offset-2">
              {t.signIn.privacyLink}
            </Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
