"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/context";

export function SignOutButton() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  async function signOut() {
    setError(null);
    try {
      const res = await fetch("/api/auth/signout", { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Sign-out failed");
      }
      router.replace("/welcome");
      router.refresh();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Sign-out failed");
    }
  }
  return (
    <div className="w-full">
      {error && (
        <p className="text-error text-sm text-center mb-1">{error}</p>
      )}
      <button
        onClick={signOut}
        className="w-full py-4 flex items-center justify-center gap-2 text-error font-semibold active:opacity-70 transition-opacity"
      >
        <Icon name="logout" className="text-error" />
        <span>{t.common.signOut}</span>
      </button>
    </div>
  );
}
