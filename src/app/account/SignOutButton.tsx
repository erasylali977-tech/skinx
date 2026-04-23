"use client";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

export function SignOutButton() {
  const router = useRouter();
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
      className="w-full py-4 rounded-full bg-surface-container-high text-on-surface font-semibold flex items-center justify-center gap-2 active:scale-95"
    >
      <Icon name="logout" />
      <span>Sign out</span>
    </button>
  );
}
