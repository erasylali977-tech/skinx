// Only test the pure synchronous helper — the async functions depend on
// Next.js server context (cookies, supabase) and are not unit-testable here.
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/auth", () => ({ getCurrentUser: jest.fn() }));
jest.mock("@/lib/mock", () => ({
  MOCK: false,
  mockListScans: jest.fn(),
  mockGetScan: jest.fn(),
}));

import { getSignedThumb } from "@/lib/scans";

describe("getSignedThumb", () => {
  it("returns API URL for mock paths", () => {
    expect(getSignedThumb("mock:abc-123")).toBe("/api/scans/abc-123/image");
  });

  it("returns API URL for mock paths with complex id", () => {
    expect(getSignedThumb("mock:550e8400-e29b-41d4-a716-446655440000")).toBe(
      "/api/scans/550e8400-e29b-41d4-a716-446655440000/image",
    );
  });

  it("returns null for null input", () => {
    expect(getSignedThumb(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(getSignedThumb(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getSignedThumb("")).toBeNull();
  });

  it("returns null for real Supabase paths (non-mock)", () => {
    expect(getSignedThumb("user-id/scan-id.jpg")).toBeNull();
  });
});
