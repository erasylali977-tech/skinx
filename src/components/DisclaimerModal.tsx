"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

const STORAGE_KEY = "skinx_disclaimer_accepted";

export function DisclaimerModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface rounded-[28px] p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
            <Icon name="health_and_safety" className="text-error text-2xl" />
          </div>
          <h2 className="text-lg font-bold text-on-surface leading-tight">
            Medical Disclaimer
          </h2>
        </div>

        <p className="text-on-surface-variant text-sm leading-relaxed mb-3">
          SkinX is an <strong className="text-on-surface">informational tool only</strong> and is{" "}
          <strong className="text-on-surface">not a medical device</strong>. AI analysis results
          are not a substitute for professional medical advice, diagnosis, or treatment.
        </p>
        <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
          Always consult a qualified dermatologist or healthcare provider about any skin concerns,
          especially if you notice rapid changes in size, shape, or colour of a mole or skin spot.
        </p>

        <button
          onClick={accept}
          className="w-full bg-primary-gradient text-white font-bold py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
        >
          I understand
        </button>
      </div>
    </div>
  );
}
