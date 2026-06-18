import type { Profile, Scan } from "@/lib/types";

export const MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === "1";

type User = { id: string; email: string; full_name: string | null };
type MockImage = { bytes: Uint8Array; contentType: string };

type Store = {
  users: Map<string, User & { password: string }>;
  emails: Map<string, string>; // email → uid
  profiles: Map<string, Profile>;
  scans: Map<string, Scan>;
  images: Map<string, MockImage>;
};

const g = globalThis as unknown as { __skinxStore?: Store };

function store(): Store {
  if (!g.__skinxStore) {
    g.__skinxStore = {
      users: new Map(),
      emails: new Map(),
      profiles: new Map(),
      scans: new Map(),
      images: new Map(),
    };
  }
  return g.__skinxStore;
}

function defaultProfile(uid: string, fullName: string | null = null): Profile {
  return {
    id: uid,
    full_name: fullName,
    nickname: null,
    avatar: "\u{1F464}",
    age_range: null,
    sex: null,
    skin_type: null,
    skin_texture: null,
    risk_factors: [],
    onboarded: false,
    created_at: new Date().toISOString(),
  };
}

export function mockSignUp(email: string, password: string, fullName: string | null): User {
  const s = store();
  if (s.emails.has(email)) throw new Error("User already exists");
  const id = crypto.randomUUID();
  const user: User & { password: string } = {
    id,
    email,
    full_name: fullName,
    password,
  };
  s.users.set(id, user);
  s.emails.set(email, id);
  s.profiles.set(id, defaultProfile(id, fullName));
  return { id, email, full_name: fullName };
}

export function mockSignIn(email: string, password: string): User {
  const s = store();
  const uid = s.emails.get(email);
  if (!uid) throw new Error("Invalid email or password");
  const u = s.users.get(uid);
  if (!u || u.password !== password) throw new Error("Invalid email or password");
  return { id: u.id, email: u.email, full_name: u.full_name };
}

export function mockGetUser(uid: string | undefined | null): User | null {
  if (!uid) return null;
  const u = store().users.get(uid);
  return u ? { id: u.id, email: u.email, full_name: u.full_name } : null;
}

export function mockGetProfile(uid: string): Profile | null {
  return store().profiles.get(uid) ?? null;
}

export function mockUpsertProfile(uid: string, patch: Partial<Profile>): Profile {
  const s = store();
  const prev = s.profiles.get(uid) ?? defaultProfile(uid);
  const next: Profile = { ...prev, ...patch, id: uid };
  s.profiles.set(uid, next);
  return next;
}

export function mockListScans(uid: string): Scan[] {
  return Array.from(store().scans.values())
    .filter((s) => s.user_id === uid)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function mockGetScan(id: string): Scan | null {
  return store().scans.get(id) ?? null;
}

export function mockInsertScan(scan: Scan, image: MockImage) {
  const s = store();
  s.scans.set(scan.id, scan);
  s.images.set(scan.id, image);
}

export function mockDeleteScan(id: string) {
  const s = store();
  s.scans.delete(id);
  s.images.delete(id);
}

export function mockGetImage(id: string): MockImage | null {
  return store().images.get(id) ?? null;
}
