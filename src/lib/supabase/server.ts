import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv, getSupabaseServiceEnv } from "@/lib/supabase/env";

class MissingSupabaseEnvError extends Error {
  constructor(which: string) {
    super(`Supabase env vars missing (${which})`);
    this.name = "MissingSupabaseEnvError";
  }
}

export function createClient() {
  const env = getSupabaseEnv();
  if (!env) throw new MissingSupabaseEnvError("NEXT_PUBLIC_SUPABASE_URL/ANON_KEY");
  const cookieStore = cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          /* called from a Server Component that can't set cookies */
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          /* ignore */
        }
      },
    },
  });
}

export function createServiceClient() {
  const env = getSupabaseServiceEnv();
  if (!env) throw new MissingSupabaseEnvError("SUPABASE_SERVICE_ROLE_KEY");
  return createServerClient(env.url, env.serviceKey, {
    cookies: {
      get() {
        return undefined;
      },
      set() {},
      remove() {},
    },
  });
}
