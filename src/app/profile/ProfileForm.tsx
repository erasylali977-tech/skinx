"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";
import { AvatarPicker } from "@/components/AvatarPicker";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";

const MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === "1";

const AGE_RANGES = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const SKIN_TYPES = [
  { id: "I", color: "#fcedeb" },
  { id: "II", color: "#f4dcc5" },
  { id: "III", color: "#e3c19e" },
  { id: "IV", color: "#c39567" },
  { id: "V", color: "#8c5e35" },
  { id: "VI", color: "#4a2e1b" },
];

export function ProfileForm({ initial }: { initial: Profile | null }) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [nickname, setNickname] = useState<string>(initial?.nickname ?? "");
  const [avatar, setAvatar] = useState<string>(initial?.avatar ?? "👤");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [age, setAge] = useState<string>(initial?.age_range ?? "");
  const [sex, setSex] = useState<string>(initial?.sex ?? "");
  const [skinType, setSkinType] = useState<string>(initial?.skin_type ?? "II");
  const [risks, setRisks] = useState<string[]>(initial?.risk_factors ?? []);
  const [error, setError] = useState<string | null>(null);

  const SEX_OPTIONS = [
    { value: "Male", label: t.profile.male },
    { value: "Female", label: t.profile.female },
    { value: "Other", label: t.profile.other },
  ];
  const RISKS = [
    { value: "Family history", label: t.profile.risks.familyHistory },
    { value: "Many moles", label: t.profile.risks.manyMoles },
    { value: "Frequent sun exposure", label: t.profile.risks.sunExposure },
    { value: "Previous skin cancer", label: t.profile.risks.previousCancer },
    { value: "Use tanning beds", label: t.profile.risks.tanningBeds },
  ];

  async function handleAvatarFile(file: File) {
    if (MOCK) {
      setAvatar(URL.createObjectURL(file));
      return;
    }
    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatar(data.publicUrl + `?t=${Date.now()}`);
    } catch (e) {
      console.error("Avatar upload failed:", e);
    } finally {
      setUploadingAvatar(false);
    }
  }

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
          nickname: nickname.trim() || null,
          avatar: avatar || "👤",
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
      {/* Avatar & Nickname Section */}
      <section className="bg-surface-container-lowest rounded-xl p-6 space-y-6 shadow-ambient">
        <div className="flex flex-col items-center">
          <AvatarPicker value={avatar} onChange={setAvatar} onFileSelect={handleAvatarFile} uploading={uploadingAvatar} />
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
            {t.profile.nickname} ({t.common.optional})
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t.profile.nicknamePlaceholder}
            maxLength={30}
            className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-lg font-medium placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-6 space-y-8 shadow-ambient">
        <h2 className="text-xl font-bold tracking-tight">{t.profile.demographics}</h2>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
            {t.profile.age}
          </label>
          <div className="relative bg-surface-container-low rounded-lg p-1 flex items-center">
            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full appearance-none bg-transparent text-lg font-medium py-3 pl-4 pr-10 cursor-pointer focus:outline-none"
            >
              <option value="" disabled>
                {t.profile.selectAge}
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
            {t.profile.sex}
          </label>
          <div className="flex bg-surface-container-high rounded-lg p-1 gap-1">
            {SEX_OPTIONS.map((s) => (
              <button
                type="button"
                key={s.value}
                onClick={() => setSex(s.value)}
                className={cn(
                  "flex-1 py-3 rounded-md font-semibold transition-all",
                  sex === s.value
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-6 space-y-6 shadow-ambient">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t.profile.skinType}</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {t.profile.skinTypeHint}
          </p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {SKIN_TYPES.map((skin) => {
            const active = skinType === skin.id;
            return (
              <button
                type="button"
                key={skin.id}
                onClick={() => setSkinType(skin.id)}
                className="flex flex-col items-center gap-3 focus:outline-none group"
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-full shadow-sm border-2 transition-all",
                    active
                      ? "border-primary-container ring-4 ring-primary/10"
                      : "border-transparent group-hover:border-primary-container/50",
                  )}
                  style={{ background: skin.color }}
                />
                <span
                  className={cn(
                    "text-sm",
                    active
                      ? "font-bold text-primary"
                      : "font-medium text-on-surface-variant",
                  )}
                >
                  {t.profile.type} {skin.id}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-6 space-y-6 shadow-ambient">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t.profile.riskFactors}</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {t.profile.riskFactorsHint}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {RISKS.map((r) => {
            const active = risks.includes(r.value);
            return (
              <button
                type="button"
                key={r.value}
                onClick={() => toggleRisk(r.value)}
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
                <span>{r.label}</span>
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
            <span>{pending ? t.common.saving : t.common.continue}</span>
            <Icon name="arrow_forward" weight={600} />
          </button>
        </div>
      </div>
    </div>
  );
}
