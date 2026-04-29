"use client";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/context";

export function SignOutButton() {
  const router = useRouter();
  const { t } = useI18n();
  async function signOut() {
    // Always go through the server route so both mock cookie and
    // Supabase SSR auth cookies get cleared reliably.
    await fetch("/api/auth/signout", { method: "POST" });
    router.replace("/welcome");
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      className="w-full py-4 flex items-center justify-center gap-2 text-error font-semibold active:opacity-70 transition-opacity"
    >
      <Icon name="logout" className="text-error" />
      <span>{t.common.signOut}</span>
    </button>
  );
}
