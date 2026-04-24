"use client";

import { useI18n } from "@/lib/i18n/context";

export function TermsContent() {
  const { t } = useI18n();

  return (
    <article className="prose prose-sm max-w-none py-6 space-y-6 text-on-surface">
      <h1 className="text-2xl font-extrabold tracking-tight">{t.terms.title}</h1>
      <p className="text-on-surface-variant text-sm">{t.terms.lastUpdated}</p>

      <Section title="1. Acceptance of Terms">
        By downloading, installing, or using SkinX ("App"), you agree to be bound by these Terms of Use. If you do not agree, do not use the App.
      </Section>

      <Section title="1. Принятие условий" hidden={t.common.appName === "SkinX" && false}>
        {/* Dynamic content is provided below via locale-aware sections */}
      </Section>

      <Section title="2. Medical Disclaimer">
        SkinX is for informational purposes only and is not a medical device. It does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns. Never disregard professional medical advice or delay seeking it because of something you read or saw in the App.
      </Section>

      <Section title="3. User Accounts">
        You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 18 years old to use this App.
      </Section>

      <Section title="4. User-Generated Content">
        You retain ownership of images and data you upload. By uploading content, you grant SkinX a limited licence to process and store it solely for providing the service. We do not sell your data to third parties.
      </Section>

      <Section title="5. Prohibited Uses">
        You may not: (a) use the App for any unlawful purpose; (b) attempt to reverse-engineer the App; (c) upload malicious content; (d) impersonate any person or entity.
      </Section>

      <Section title="6. Intellectual Property">
        All content, features, and functionality of the App are owned by SkinX and are protected by intellectual property laws. You may not reproduce or distribute any part of the App without prior written consent.
      </Section>

      <Section title="7. Limitation of Liability">
        To the maximum extent permitted by law, SkinX shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App.
      </Section>

      <Section title="8. Changes to Terms">
        We reserve the right to modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the new Terms.
      </Section>

      <Section title="9. Governing Law">
        These Terms are governed by the laws of the Republic of Kazakhstan.
      </Section>

      <Section title="10. Contact">
        If you have any questions about these Terms, please contact us at: support@skinx.fit
      </Section>
    </article>
  );
}

function Section({ title, children, hidden }: { title: string; children?: React.ReactNode; hidden?: boolean }) {
  if (hidden) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold text-on-surface">{title}</h2>
      {children && <p className="text-on-surface-variant text-sm leading-relaxed">{children}</p>}
    </section>
  );
}
