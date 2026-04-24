import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { SignOutButton } from "./SignOutButton";
import { getCurrentUser } from "@/lib/auth";
import { MOCK, mockGetProfile } from "@/lib/mock";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  let profile: any = null;
  if (MOCK) {
    profile = mockGetProfile(user.id);
  } else {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32 pt-24">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-6 space-y-8">
        <section>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            Profile
          </h1>
          <p className="text-on-surface-variant text-lg">{user.email}</p>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-6 space-y-4 shadow-ambient">
          <Row label="Age range" value={profile?.age_range ?? "—"} />
          <Row label="Sex" value={profile?.sex ?? "—"} />
          <Row
            label="Fitzpatrick skin type"
            value={profile?.skin_type ? `Type ${profile.skin_type}` : "—"}
          />
          <Row
            label="Risk factors"
            value={
              profile?.risk_factors && profile.risk_factors.length
                ? profile.risk_factors.join(", ")
                : "None"
            }
          />
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-primary font-semibold mt-2"
          >
            <Icon name="edit" className="text-[18px]" /> Edit profile
          </Link>
        </section>

        <section className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-ambient">
          <Link href="/terms" className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low transition-colors border-b border-outline-variant/30">
            <span className="font-medium">Terms of Use</span>
            <Icon name="chevron_right" className="text-on-surface-variant" />
          </Link>
          <Link href="/privacy" className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low transition-colors">
            <span className="font-medium">Privacy Policy</span>
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
