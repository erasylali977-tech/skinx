"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === "1";

export function SignUpForm() {
  const router = useRouter();
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
          throw new Error(j.error || "Sign-up failed");
        }
        router.push("/profile");
        router.refresh();
      } else {
        // Create user server-side with email auto-confirmed, then sign in.
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, full_name: name }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || "Sign-up failed");
        }
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push("/home");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message ?? "Sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-3">
      <input
        type="text"
        placeholder="Full name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-3 rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:outline-none text-base"
      />
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
        placeholder="Password (min 6 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-3 rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:outline-none text-base"
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
        className="w-full py-4 rounded-full bg-primary-gradient text-on-primary font-bold text-lg shadow-primary-glow active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
