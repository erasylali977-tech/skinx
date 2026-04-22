"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === "1";

const AGE_RANGES = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const SEX = ["Male", "Female", "Other"];
const SKIN_TYPES = [
  { id: "I", color: "#fcedeb" },
  { id: "II", color: "#f4dcc5" },
  { id: "III", color: "#e3c19e" },
  { id: "IV", color: "#c39567" },
  { id: "V", color: "#8c5e35" },
  { id: "VI", color: "#4a2e1b" },
];
const RISKS = [
  "Family history",
  "Many moles",
  "Frequent sun exposure",
  "Previous skin cancer",
  "Use tanning beds",
];

export function ProfileForm({ initial }: { initial: Profile | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [age, setAge] = useState<string>(initial?.age_range ?? "");
  const [sex, setSex] = useState<string>(initial?.sex ?? "");
  const [skinType, setSkinType] = useState<string>(initial?.skin_type ?? "II");
  const [risks, setRisks] = useState<string[]>(initial?.risk_factors ?? []);
  const [error, setError] = useState<string | null>(null);

  function toggleRisk(r: string) {
    setRisks((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  }

  function save() {
    setError(null);
    start(async () => {
      try {
        const payload = {
          age_range: age || null,
          sex: sex || null,
          skin_type: skinType || null,
          risk_factors: risks,
        };
        if (MOCK) {
          const res = await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.error || "Failed to save profile");
          }
        } else {
          const supabase = createClient();
          const { data: userRes } = await supabase.auth.getUser();
          const uid = userRes.user?.id;
          if (!uid) throw new Error("Not signed in");
          const { error } = await supabase.from("profiles").upsert({
            id: uid,
            ...payload,
            onboarded: true,
            updated_at: new Date().toISOString(),
          });
          if (error) throw error;
        }
        router.push("/home");
        router.refresh();
      } catch (e: any) {
        setError(e?.message ?? "Failed to save profile");
      }
    });
  }

  return (
    <div className="space-y-6 pb-24">
      <section className="bg-surface-container-lowest rounded-xl p-6 space-y-8 shadow-ambient">
        <h2 className="text-xl font-bold tracking-tight">Demographics</h2>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
            Age
          </label>
          <div className="relative bg-surface-container-low rounded-lg p-1 flex items-center">
            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full appearance-none bg-transparent text-lg font-medium py-3 pl-4 pr-10 cursor-pointer focus:outline-none"
            >
              <option value="" disabled>
                Select your age range
              </option>
              {AGE_RANGES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <Icon
              name="expand_more"
              className="absolute right-4 text-on-surface-variant pointer-events-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
            Sex assigned at birth
          </label>
          <div className="flex bg-surface-container-high rounded-lg p-1 gap-1">
            {SEX.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSex(s)}
                className={cn(
                  "flex-1 py-3 rounded-md font-semibold transition-all",
                  sex === s
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-6 space-y-6 shadow-ambient">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Skin Type</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Select the tone that best matches your natural skin.
          </p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {SKIN_TYPES.map((t) => {
            const active = skinType === t.id;
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => setSkinType(t.id)}
                className="flex flex-col items-center gap-3 focus:outline-none group"
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-full shadow-sm border-2 transition-all",
                    active
                      ? "border-primary-container ring-4 ring-primary/10"
                      : "border-transparent group-hover:border-primary-container/50",
                  )}
                  style={{ background: t.color }}
                />
                <span
                  className={cn(
                    "text-sm",
                    active
                      ? "font-bold text-primary"
                      : "font-medium text-on-surface-variant",
                  )}
                >
                  Type {t.id}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-6 space-y-6 shadow-ambient">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Risk Factors</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Select all that apply to you.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {RISKS.map((r) => {
            const active = risks.includes(r);
            return (
              <button
                type="button"
                key={r}
                onClick={() => toggleRisk(r)}
                className={cn(
                  "px-5 py-3 rounded-full text-sm transition-colors flex items-center gap-2",
                  active
                    ? "bg-primary-container text-on-primary-container font-semibold"
                    : "bg-surface-container-highest text-on-surface font-medium hover:bg-surface-dim",
                )}
              >
                {active ? (
                  <Icon name="check" className="text-sm" />
                ) : null}
                <span>{r}</span>
              </button>
            );
          })}
        </div>
      </section>

      {error ? (
        <p className="text-error text-sm text-center font-medium">{error}</p>
      ) : null}

      <div className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-xl pb-8 pt-4 px-6 z-40">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="w-full py-4 rounded-full bg-primary-gradient text-on-primary font-bold text-lg shadow-primary-glow active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <span>{pending ? "Saving…" : "Continue"}</span>
            <Icon name="arrow_forward" weight={600} />
          </button>
        </div>
      </div>
    </div>
  );
}
