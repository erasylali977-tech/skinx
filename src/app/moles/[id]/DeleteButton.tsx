"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this scan? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/scans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className="px-6 py-4 rounded-full bg-surface-container-high text-on-surface font-semibold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
    >
      <Icon name="delete" />
      <span className="hidden sm:inline">Delete</span>
    </button>
  );
}
