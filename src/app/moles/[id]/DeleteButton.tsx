"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/context";

export function DeleteButton({ id }: { id: string }) {
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
      className="px-6 py-4 rounded-full bg-surface-container-high text-on-surface font-semibold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
    >
      <Icon name="delete" />
      <span className="hidden sm:inline">{t.moles.deleteScan}</span>
    </button>
  );
}
