import {
  mockSignUp,
  mockSignIn,
  mockGetUser,
  mockGetProfile,
  mockUpsertProfile,
  mockListScans,
  mockGetScan,
  mockInsertScan,
  mockDeleteScan,
  mockGetImage,
} from "@/lib/mock";
import type { Scan } from "@/lib/types";

// Reset the global store before each test
beforeEach(() => {
  const g = globalThis as unknown as { __skinxStore?: unknown };
  delete g.__skinxStore;
});

describe("mockSignUp", () => {
  it("creates a new user and returns it", () => {
    const user = mockSignUp("test@example.com", "pass123", "Test User");
    expect(user.email).toBe("test@example.com");
    expect(user.full_name).toBe("Test User");
    expect(user.id).toBeTruthy();
  });

  it("creates a profile for the new user", () => {
    const user = mockSignUp("p@test.com", "pass", null);
    const profile = mockGetProfile(user.id);
    expect(profile).not.toBeNull();
    expect(profile!.id).toBe(user.id);
    expect(profile!.onboarded).toBe(false);
    expect(profile!.avatar).toBe("👤");
  });

  it("throws if email already exists", () => {
    mockSignUp("dup@test.com", "pass1", "A");
    expect(() => mockSignUp("dup@test.com", "pass2", "B")).toThrow("User already exists");
  });

  it("handles null full_name", () => {
    const user = mockSignUp("anon@test.com", "pass", null);
    expect(user.full_name).toBeNull();
  });
});

describe("mockSignIn", () => {
  it("signs in with correct credentials", () => {
    mockSignUp("login@test.com", "secret", "Login User");
    const user = mockSignIn("login@test.com", "secret");
    expect(user.email).toBe("login@test.com");
    expect(user.full_name).toBe("Login User");
  });

  it("throws for wrong email", () => {
    expect(() => mockSignIn("nonexistent@test.com", "pass")).toThrow("Invalid email or password");
  });

  it("throws for wrong password", () => {
    mockSignUp("pwd@test.com", "correct", "User");
    expect(() => mockSignIn("pwd@test.com", "wrong")).toThrow("Invalid email or password");
  });
});

describe("mockGetUser", () => {
  it("returns user by id", () => {
    const created = mockSignUp("get@test.com", "pass", "Get User");
    const user = mockGetUser(created.id);
    expect(user).not.toBeNull();
    expect(user!.email).toBe("get@test.com");
  });

  it("returns null for unknown id", () => {
    expect(mockGetUser("nonexistent")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(mockGetUser(undefined)).toBeNull();
  });

  it("returns null for null", () => {
    expect(mockGetUser(null)).toBeNull();
  });
});

describe("mockGetProfile / mockUpsertProfile", () => {
  it("returns null for unknown user", () => {
    expect(mockGetProfile("unknown")).toBeNull();
  });

  it("upserts profile for existing user", () => {
    const user = mockSignUp("upsert@test.com", "pass", "Upsert");
    const updated = mockUpsertProfile(user.id, {
      nickname: "upsy",
      onboarded: true,
      skin_type: "III",
    });
    expect(updated.nickname).toBe("upsy");
    expect(updated.onboarded).toBe(true);
    expect(updated.skin_type).toBe("III");
    expect(updated.full_name).toBe("Upsert"); // preserved from signup
  });

  it("creates default profile for unknown user on upsert", () => {
    const profile = mockUpsertProfile("brand-new-id", { nickname: "new" });
    expect(profile.id).toBe("brand-new-id");
    expect(profile.nickname).toBe("new");
    expect(profile.onboarded).toBe(false);
  });

  it("preserves existing fields not in patch", () => {
    const user = mockSignUp("keep@test.com", "pass", "Keeper");
    mockUpsertProfile(user.id, { nickname: "n1", skin_type: "II" });
    const updated = mockUpsertProfile(user.id, { nickname: "n2" });
    expect(updated.nickname).toBe("n2");
    expect(updated.skin_type).toBe("II"); // preserved
  });
});

describe("scan CRUD operations", () => {
  const makeScan = (id: string, userId: string, createdAt: string): Scan => ({
    id,
    user_id: userId,
    image_path: `mock:${id}`,
    body_area: "face",
    notes: "test",
    summary: "test summary",
    risk_score: 25,
    risk_level: "low",
    status: "stable",
    abcde: { asymmetry: 10, border: 10, color: 10, diameter: 10, evolution: 10 },
    created_at: createdAt,
  });

  it("inserts and retrieves a scan", () => {
    const scan = makeScan("s1", "u1", "2024-01-01T00:00:00Z");
    const image = { bytes: new Uint8Array([1, 2, 3]), contentType: "image/jpeg" };
    mockInsertScan(scan, image);

    expect(mockGetScan("s1")).toEqual(scan);
  });

  it("returns null for unknown scan", () => {
    expect(mockGetScan("nonexistent")).toBeNull();
  });

  it("lists scans filtered by user, sorted by date desc", () => {
    const s1 = makeScan("a1", "user-a", "2024-01-01T00:00:00Z");
    const s2 = makeScan("a2", "user-a", "2024-03-01T00:00:00Z");
    const s3 = makeScan("b1", "user-b", "2024-02-01T00:00:00Z");
    const img = { bytes: new Uint8Array([1]), contentType: "image/jpeg" };

    mockInsertScan(s1, img);
    mockInsertScan(s2, img);
    mockInsertScan(s3, img);

    const userAScans = mockListScans("user-a");
    expect(userAScans).toHaveLength(2);
    expect(userAScans[0].id).toBe("a2"); // newer first
    expect(userAScans[1].id).toBe("a1");

    expect(mockListScans("user-b")).toHaveLength(1);
    expect(mockListScans("user-c")).toHaveLength(0);
  });

  it("deletes a scan and its image", () => {
    const scan = makeScan("del1", "u1", "2024-01-01T00:00:00Z");
    const image = { bytes: new Uint8Array([5, 6]), contentType: "image/png" };
    mockInsertScan(scan, image);

    expect(mockGetScan("del1")).not.toBeNull();
    expect(mockGetImage("del1")).not.toBeNull();

    mockDeleteScan("del1");

    expect(mockGetScan("del1")).toBeNull();
    expect(mockGetImage("del1")).toBeNull();
  });

  it("mockGetImage returns image data", () => {
    const scan = makeScan("img1", "u1", "2024-01-01T00:00:00Z");
    const image = { bytes: new Uint8Array([10, 20, 30]), contentType: "image/jpeg" };
    mockInsertScan(scan, image);

    const retrieved = mockGetImage("img1");
    expect(retrieved).not.toBeNull();
    expect(retrieved!.contentType).toBe("image/jpeg");
    expect(retrieved!.bytes).toEqual(new Uint8Array([10, 20, 30]));
  });

  it("mockGetImage returns null for unknown id", () => {
    expect(mockGetImage("nonexistent")).toBeNull();
  });
});
