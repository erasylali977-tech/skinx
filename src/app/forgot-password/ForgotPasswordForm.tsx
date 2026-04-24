"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        },
      );
      if (resetError) throw resetError;
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? t.common.error);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-gray-800 font-semibold text-lg">{t.forgotPassword.checkInbox}</p>
        <p className="text-gray-500 text-sm">
          {t.forgotPassword.sentLink} <strong>{email}</strong>.
          <br />
          {t.forgotPassword.linkExpires}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3 rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:outline-none text-base"
      />
      {error ? (
        <p className="text-red-500 text-sm font-medium text-center">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-full bg-primary-gradient text-on-primary font-bold text-lg shadow-primary-glow active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? t.forgotPassword.sending : t.forgotPassword.sendBtn}
      </button>
    </form>
  );
}
