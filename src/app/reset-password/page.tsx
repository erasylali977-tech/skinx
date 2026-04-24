"use client";
import { Suspense } from "react";
import { Icon } from "@/components/Icon";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { useI18n } from "@/lib/i18n/context";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  return (
    <div className="bg-white text-gray-900 flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 w-full max-w-md mx-auto">
        <div className="w-full flex flex-col items-center justify-center mb-12 space-y-6">
          <div className="w-20 h-20 rounded-[2rem] bg-gray-100 shadow-sm flex items-center justify-center">
            <Icon name="lock" filled className="text-4xl text-primary" />
          </div>
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              {t.resetPassword.title}
            </h1>
            <p className="text-base text-gray-500 font-medium">
              {t.resetPassword.subtitle}
            </p>
          </div>
        </div>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
