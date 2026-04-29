"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/context";

export function DeleteButton({ id, fullWidth }: { id: string; fullWidth?: boolean }) {
  const router = useRouter();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm(t.moles.deleteConfirm)) return;
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
      className={`py-3.5 rounded-2xl border border-red-500/30 text-red-500 font-semibold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 transition-all text-sm ${fullWidth ? "w-full" : "px-6"}`}
    >
      <Icon name="delete" />
      {t.moles.deleteScan}
    </button>
  );
}
