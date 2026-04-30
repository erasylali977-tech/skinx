"use client";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { SignOutButton } from "./SignOutButton";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  email: string;
  full_name?: string | null;
  profile: {
    nickname?: string | null;
    avatar?: string | null;
    age_range?: string | null;
    sex?: string | null;
    skin_type?: string | null;
    risk_factors?: string[] | null;
  } | null;
};

const SKIN_TYPES = ["I", "II", "III", "IV", "V", "VI"];
const SKIN_COLORS = ["#f8ede3", "#f4dcc5", "#e3c19e", "#c39567", "#8c5e35", "#4a2e1b"];

const SEX_MAP: Record<string, "male" | "female" | "other"> = {
  Male: "male",
  Female: "female",
  Other: "other",
};

const RISK_MAP: Record<string, "familyHistory" | "manyMoles" | "sunExposure" | "previousCancer" | "tanningBeds"> = {
  "Family history": "familyHistory",
  "Many moles": "manyMoles",
  "Frequent sun exposure": "sunExposure",
  "Previous skin cancer": "previousCancer",
  "Use tanning beds": "tanningBeds",
};

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function AccountContent({ email, full_name, profile }: Props) {
  const { t } = useI18n();

  function translateSex(val: string | null | undefined): string {
    if (!val) return "—";
    const key = SEX_MAP[val];
    return key ? (t.profile[key] as string) : val;
  }

  function translateRisk(v: string): string {
    const key = RISK_MAP[v];
    return key ? (t.profile.risks[key] as string) : v;
  }

  const skinTypeIndex = SKIN_TYPES.indexOf(profile?.skin_type ?? "");
  const skinBarPos = skinTypeIndex >= 0 ? skinTypeIndex / (SKIN_TYPES.length - 1) : null;
  const risks = profile?.risk_factors ?? [];
  const avatar = profile?.avatar || "👤";
  const nickname = profile?.nickname;
  const initials = getInitials(full_name, email);
  const displayName = nickname || full_name || email.split("@")[0];

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32 pt-20">
      <AppHeader />
      <main className="max-w-md mx-auto px-5 space-y-5">

        {/* Avatar + name + edit */}
        <section className="flex flex-col items-center pt-6 pb-2 gap-3">
          <div className="w-24 h-24 rounded-full bg-primary-gradient flex items-center justify-center text-5xl shadow-primary-glow select-none overflow-hidden">
            {avatar.startsWith("http") || avatar.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              avatar
            )}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">{displayName}</h1>
            <p className="text-on-surface-variant text-sm mt-0.5">{email}</p>
          </div>
          <Link
            href="/profile"
            className="flex items-center gap-2 px-5 py-2 rounded-full border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <Icon name="edit" className="text-[15px]" />
            {t.account.editProfile}
          </Link>
        </section>

        {/* Skin Passport */}
        <section className="bg-surface-container-lowest rounded-2xl p-5 space-y-3 shadow-ambient">
          <div className="flex items-center gap-2 pb-1">
            <Icon name="badge" className="text-primary text-[22px]" />
            <h2 className="text-base font-bold">{t.account.skinPassport}</h2>
          </div>

          {/* Age + Gender grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-on-surface-variant mb-1.5">
                <Icon name="calendar_today" className="text-[13px]" />
                <span className="text-[11px] font-semibold uppercase tracking-wide">{t.account.ageRange}</span>
              </div>
              <p className="text-xl font-bold leading-none">{profile?.age_range ?? "—"}</p>
            </div>
            <div className="bg-surface-container rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-on-surface-variant mb-1.5">
                <Icon name="person" className="text-[13px]" />
                <span className="text-[11px] font-semibold uppercase tracking-wide">{t.account.sexLabel}</span>
              </div>
              <p className="text-xl font-bold leading-none">{translateSex(profile?.sex)}</p>
            </div>
          </div>

          {/* Fitzpatrick */}
          <div className="bg-surface-container rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <Icon name="palette" className="text-[13px]" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">{t.account.fitzpatrick}</span>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold whitespace-nowrap min-w-[52px]">
                {profile?.skin_type ? `${t.profile.type} ${profile.skin_type}` : "—"}
              </p>
              <div className="flex-1 relative h-5 rounded-full overflow-hidden"
                style={{ background: `linear-gradient(to right, ${SKIN_COLORS.join(", ")})` }}>
                {skinBarPos !== null && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full border-2 border-white shadow-md"
                    style={{
                      left: `calc(${skinBarPos * 100}% - 9px)`,
                      background: SKIN_COLORS[skinTypeIndex],
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          {risks.length > 0 && (
            <div className="bg-surface-container rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <Icon name="warning" className="text-[13px]" />
                <span className="text-[11px] font-semibold uppercase tracking-wide">{t.account.riskFactorsLabel}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {risks.map((r) => (
                  <span
                    key={r}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-tertiary-container text-on-tertiary-container"
                  >
                    {translateRisk(r)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {risks.length === 0 && (
            <p className="text-xs text-on-surface-variant px-1">{t.account.none}</p>
          )}
        </section>

        {/* Legal links */}
        <section className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-ambient">
          <Link href="/terms" className="flex items-center justify-between px-5 py-4 hover:bg-surface-container-low transition-colors border-b border-outline-variant/30">
            <span className="font-medium text-sm">{t.account.terms}</span>
            <Icon name="chevron_right" className="text-on-surface-variant" />
          </Link>
          <Link href="/privacy" className="flex items-center justify-between px-5 py-4 hover:bg-surface-container-low transition-colors">
            <span className="font-medium text-sm">{t.account.privacy}</span>
            <Icon name="chevron_right" className="text-on-surface-variant" />
          </Link>
        </section>

        <SignOutButton />
        <div className="border-t border-outline-variant/30 pt-2">
          <DeleteAccountButton />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
