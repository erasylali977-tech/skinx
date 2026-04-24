"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";

const MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === "1";

export function SignInForm() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useSearchParams();
  const next = params.get("next") || "/home";

  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") ?? null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (MOCK) {
        const res = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || t.signIn.signInBtn);
        }
      } else {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      router.replace(next);
    } catch (err: any) {
      setError(err?.message ?? t.common.error);
    } finally {
      setLoading(false);
    }
  }

  async function oauth(provider: "google" | "apple") {
    if (MOCK) {
      setError(t.common.error);
      setShowEmail(true);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      // Use NEXT_PUBLIC_APP_URL so the redirect URL is always the canonical
      // domain (not window.location.origin which would be localhost in dev).
      // This URL must be in Supabase → Authentication → URL Configuration → Redirect URLs.
      const origin =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
        window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err?.message ?? t.common.error);
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex flex-col space-y-4">
      <button
        onClick={() => oauth("apple")}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white py-4 px-6 rounded-full transition-all duration-200 active:scale-95 shadow-sm disabled:opacity-60"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.05 11.46c-.02-2.14 1.75-3.19 1.83-3.24-1-1.46-2.56-1.67-3.12-1.7-1.33-.13-2.6.78-3.28.78-.68 0-1.72-.75-2.83-.73-1.46.02-2.82.85-3.57 2.16-1.53 2.65-.39 6.57 1.1 8.72.73 1.05 1.58 2.22 2.73 2.18 1.1-.04 1.53-.7 2.87-.7 1.33 0 1.73.7 2.88.68 1.18-.02 1.93-1.07 2.65-2.12.83-1.21 1.18-2.38 1.2-2.44-.02-.02-2.28-.88-2.3-3.35l-.16-1.2zM14.93 7.37c.6-.73 1-1.73.89-2.73-1 .04-2.05.6-2.67 1.33-.55.63-.98 1.66-.85 2.64 1.1.08 2.03-.52 2.63-1.24z" />
        </svg>
        <span className="text-[19px] font-semibold tracking-tight">
          {t.signIn.continueApple}
        </span>
      </button>

      <button
        onClick={() => oauth("google")}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-4 px-6 rounded-full transition-all duration-200 active:scale-95 shadow-sm disabled:opacity-60"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span className="text-[19px] font-semibold tracking-tight">
          {t.signIn.continueGoogle}
        </span>
      </button>

      <div className="w-full flex items-center justify-center py-2">
        <div className="h-px bg-gray-200 w-full" />
        <span className="px-4 text-xs text-gray-500 font-medium uppercase tracking-widest">
          {t.signIn.or}
        </span>
        <div className="h-px bg-gray-200 w-full" />
      </div>

      {!showEmail ? (
        <button
          onClick={() => setShowEmail(true)}
          className="w-full py-2 text-primary text-[17px] font-semibold active:opacity-70"
        >
          {t.signIn.continueEmail}
        </button>
      ) : (
        <form onSubmit={onSubmit} className="w-full space-y-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:outline-none text-base"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder={t.signIn.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:outline-none text-base"
          />
          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-xs text-primary font-semibold underline-offset-2"
            >
              {t.signIn.forgotPassword}
            </a>
          </div>
          {error ? (
            <p className="text-error text-sm font-medium text-center">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-primary-gradient text-on-primary font-bold text-lg shadow-primary-glow active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? t.signIn.signingIn : t.signIn.signInBtn}
          </button>
        </form>
      )}
    </div>
  );
}
