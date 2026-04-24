"use client";

import { useI18n } from "@/lib/i18n/context";

export function PrivacyContent() {
  const { t } = useI18n();

  return (
    <article className="py-6 space-y-6 text-on-surface">
      <h1 className="text-2xl font-extrabold tracking-tight">{t.privacy.title}</h1>
      <p className="text-on-surface-variant text-sm">{t.privacy.lastUpdated}</p>

      <Section title="1. Information We Collect">
        We collect information you provide directly: email address, profile data (age range, sex, skin type, risk factors), and skin scan images you upload. We also collect usage data and device information automatically.
      </Section>

      <Section title="2. How We Use Your Information">
        We use your information to: provide and improve the App; personalise your experience; process and display your skin scan results; send service-related communications; comply with legal obligations.
      </Section>

      <Section title="3. Data Storage and Security">
        Your data is stored on secure servers provided by Supabase. We implement industry-standard security measures including encryption in transit (TLS) and at rest. However, no method of transmission over the Internet is 100% secure.
      </Section>

      <Section title="4. Data Sharing">
        We do not sell, trade, or rent your personal information to third parties. We may share data with service providers who assist in operating the App (e.g., cloud storage, analytics), bound by confidentiality obligations.
      </Section>

      <Section title="5. AI Analysis">
        Skin scan images are processed by AI algorithms to provide analysis results. Images may be temporarily processed by third-party AI services. We do not use your images to train AI models without your explicit consent.
      </Section>

      <Section title="6. Your Rights (GDPR / Data Subject Rights)">
        You have the right to: access your personal data; correct inaccurate data; request deletion of your data; export your data in a portable format; withdraw consent at any time. To exercise these rights, contact us at support@skinx.fit or use the account deletion feature in the App.
      </Section>

      <Section title="7. Data Retention">
        We retain your data for as long as your account is active. When you delete your account, all personal data and scan images are permanently deleted within 30 days.
      </Section>

      <Section title="8. Cookies">
        The App uses essential cookies and local storage for authentication and preferences. We do not use tracking or advertising cookies.
      </Section>

      <Section title="9. Children's Privacy">
        The App is not intended for users under the age of 18. We do not knowingly collect personal information from children.
      </Section>

      <Section title="10. Changes to This Policy">
        We may update this Privacy Policy from time to time. We will notify you of significant changes by displaying a notice in the App.
      </Section>

      <Section title="11. Contact Us">
        If you have questions about this Privacy Policy or wish to exercise your data rights, contact us at: support@skinx.fit
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold text-on-surface">{title}</h2>
      <p className="text-on-surface-variant text-sm leading-relaxed">{children}</p>
    </section>
  );
}
