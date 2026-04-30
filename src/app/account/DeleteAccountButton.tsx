"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/context";

export function DeleteAccountButton() {
  const router = useRouter();
  const { t } = useI18n();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      if (res.ok) {
        router.replace("/welcome");
        router.refresh();
      } else {
        alert("Failed to delete account. Please try again.");
        setShowConfirm(false);
      }
    } catch (e) {
      alert("An error occurred. Please try again.");
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full py-4 flex items-center justify-center gap-2 text-error/80 font-medium text-sm hover:text-error transition-colors"
      >
        <Icon name="delete" className="text-[18px]" />
        <span>{t.account.deleteAccount}</span>
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-ambient">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                <Icon name="warning" className="text-error text-[20px]" />
              </div>
              <h3 className="text-lg font-bold">{t.account.deleteAccount}</h3>
            </div>
            <p className="text-on-surface-variant text-sm mb-6">
              {t.account.deleteConfirm}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-surface-container hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-error text-white hover:bg-error/90 transition-colors disabled:opacity-50"
              >
                {deleting ? "..." : t.account.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
