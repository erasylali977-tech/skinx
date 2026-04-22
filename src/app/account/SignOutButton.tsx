"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    const MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === "1";
    if (MOCK) {
      await fetch("/api/auth/signout", { method: "POST" });
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/welcome");
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
