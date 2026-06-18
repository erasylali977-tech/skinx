"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { trackEvent } from "@/lib/analytics";
import { MOCK } from "@/lib/mock";

export function SignUpForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (MOCK) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, full_name: name }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || t.common.error);
        }
        trackEvent("signup_completed", { method: "email" });
        router.replace("/profile");
      } else {
        // Create user server-side with email auto-confirmed, then sign in.
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, full_name: name }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || t.common.error);
        }
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        trackEvent("signup_completed", { method: "email" });
        router.replace("/home");
      }
    } catch (err: any) {
      setError(err?.message ?? t.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-3">
      <input
        type="text"
        placeholder={t.signUp.namePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-3 rounded-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant focus:bg-surface-container focus:ring-2 focus:ring-primary/30 focus:outline-none text-base"
      />
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3 rounded-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant focus:bg-surface-container focus:ring-2 focus:ring-primary/30 focus:outline-none text-base"
      />
      <input
        type="password"
        required
        minLength={6}
        placeholder={t.signUp.passwordHint}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-3 rounded-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant focus:bg-surface-container focus:ring-2 focus:ring-primary/30 focus:outline-none text-base"
      />
      {error ? (
        <p className="text-error text-sm font-medium text-center">{error}</p>
      ) : null}
      {info ? (
        <p className="text-primary text-sm font-medium text-center">{info}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-full bg-primary-gradient text-white font-bold text-lg shadow-primary-glow active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? t.signUp.creating : t.signUp.createBtn}
      </button>
    </form>
  );
}
