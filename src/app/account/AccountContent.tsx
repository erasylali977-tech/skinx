"use client";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { SignOutButton } from "./SignOutButton";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  email: string;
  profile: {
    age_range?: string | null;
    sex?: string | null;
    skin_type?: string | null;
    risk_factors?: string[] | null;
  } | null;
};

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

export function AccountContent({ email, profile }: Props) {
  const { t } = useI18n();

  function translateSex(val: string | null | undefined): string {
    if (!val) return "—";
    const key = SEX_MAP[val];
    return key ? (t.profile[key] as string) : val;
  }

  function translateRisks(vals: string[] | null | undefined): string {
    if (!vals || vals.length === 0) return t.account.none;
    return vals.map((v) => {
      const key = RISK_MAP[v];
      return key ? (t.profile.risks[key] as string) : v;
    }).join(", ");
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32 pt-24">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-6 space-y-8">
        <section>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            {t.account.profileHeading}
          </h1>
          <p className="text-on-surface-variant text-lg">{email}</p>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-6 space-y-4 shadow-ambient">
          <Row label={t.account.ageRange} value={profile?.age_range ?? "—"} />
          <Row label={t.account.sexLabel} value={translateSex(profile?.sex)} />
          <Row
            label={t.account.fitzpatrick}
            value={profile?.skin_type ? `${t.profile.type} ${profile.skin_type}` : "—"}
          />
          <Row label={t.account.riskFactorsLabel} value={translateRisks(profile?.risk_factors)} />
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-primary font-semibold mt-2"
          >
            <Icon name="edit" className="text-[18px]" /> {t.account.editProfile}
          </Link>
        </section>

        <section className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-ambient">
          <Link href="/terms" className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low transition-colors border-b border-outline-variant/30">
            <span className="font-medium">{t.account.terms}</span>
            <Icon name="chevron_right" className="text-on-surface-variant" />
          </Link>
          <Link href="/privacy" className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low transition-colors">
            <span className="font-medium">{t.account.privacy}</span>
            <Icon name="chevron_right" className="text-on-surface-variant" />
          </Link>
        </section>

        <SignOutButton />
      </main>
      <BottomNav />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      <span className="text-base font-medium text-right">{value}</span>
    </div>
  );
}
