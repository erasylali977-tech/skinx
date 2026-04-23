// Shared list of protected / auth-only paths used by both mock and real
// Supabase middlewares to keep behaviour in sync.

const PROTECTED_PREFIXES = [
  "/home",
  "/dashboard",
  "/scan",
  "/moles",
  "/profile",
  "/account",
];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

export function isAuthPath(pathname: string): boolean {
  return pathname === "/sign-in" || pathname === "/sign-up";
}
