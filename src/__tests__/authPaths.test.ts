import { isProtectedPath, isAuthPath } from "@/lib/authPaths";

describe("isProtectedPath", () => {
  it.each([
    "/home",
    "/home/settings",
    "/dashboard",
    "/dashboard/stats",
    "/scan",
    "/scan/new",
    "/moles",
    "/moles/abc-123",
    "/profile",
    "/profile/edit",
    "/account",
    "/account/settings",
  ])("returns true for protected path: %s", (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each([
    "/",
    "/welcome",
    "/sign-in",
    "/sign-up",
    "/tutorial",
    "/terms",
    "/privacy",
    "/api/scans",
    "/auth/callback",
    "/forgot-password",
  ])("returns false for unprotected path: %s", (path) => {
    expect(isProtectedPath(path)).toBe(false);
  });
});

describe("isAuthPath", () => {
  it("returns true for /sign-in", () => {
    expect(isAuthPath("/sign-in")).toBe(true);
  });

  it("returns true for /sign-up", () => {
    expect(isAuthPath("/sign-up")).toBe(true);
  });

  it.each([
    "/",
    "/home",
    "/sign-in/extra",
    "/sign-up/extra",
    "/welcome",
    "/forgot-password",
    "/reset-password",
  ])("returns false for non-auth path: %s", (path) => {
    expect(isAuthPath(path)).toBe(false);
  });
});
