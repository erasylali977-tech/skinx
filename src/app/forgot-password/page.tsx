"use client";
import { Suspense } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { useI18n } from "@/lib/i18n/context";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  return (
    <div className="bg-white text-gray-900 flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 w-full max-w-md mx-auto">
        <div className="w-full flex flex-col items-center justify-center mb-12 space-y-6">
          <div className="w-20 h-20 rounded-[2rem] bg-gray-100 shadow-sm flex items-center justify-center">
            <Icon name="lock_reset" filled className="text-4xl text-primary" />
          </div>
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              {t.forgotPassword.title}
            </h1>
            <p className="text-base text-gray-500 font-medium">
              {t.forgotPassword.subtitle}
            </p>
          </div>
        </div>
        <Suspense fallback={null}>
          <ForgotPasswordForm />
        </Suspense>
        <div className="w-full text-center mt-10">
          <Link
            href="/sign-in"
            className="text-sm text-primary font-semibold underline-offset-2"
          >
            {t.forgotPassword.backToSignIn}
          </Link>
        </div>
      </main>
    </div>
  );
}
