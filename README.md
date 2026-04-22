# SkinX — AI Skin Tracker (PWA)

Full-stack PWA for tracking moles and skin spots, built with Next.js 14 (App Router, TypeScript), TailwindCSS and Supabase (Auth + Postgres + Storage). Design follows the **Curated Sanctuary** philosophy (see `refrences/`).

## Stack

- Next.js 14 App Router, React 18, TypeScript
- TailwindCSS with Material 3 design tokens (`tailwind.config.ts`)
- Supabase SSR (`@supabase/ssr`) for auth cookies + Postgres + Storage
- Pluggable AI analyzer (`src/lib/ai/skinAnalyzer.ts`) — ships with a deterministic `MockSkinAnalyzer`, swap with a real model later
- PWA: `manifest.webmanifest`, service worker at `public/sw.js`, installable

## Pages / flows

- `/welcome` — hero intro with language switcher
- `/tutorial` — 3-slide carousel with snap-scroll
- `/sign-in`, `/sign-up` — Apple/Google buttons (show toast) + real email/password via Supabase
- `/profile` — onboarding questionnaire (age, sex, Fitzpatrick I–VI, risk factors)
- `/home` — hello + "Start Scan" CTA + recent scans horizontal scroll
- `/dashboard` — stat cards + grid of skin cards
- `/scan` — intelligent scanner overlay (camera capture / file upload)
- `/moles/[id]` — full detail: baseline vs latest, ABCDE metrics, history, AI insights, delete
- `/account` — profile summary + sign out
- API: `POST/GET /api/scans`, `GET/DELETE /api/scans/[id]`

## Setup

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

npm install
npm run dev
```

### Supabase

1. Create a Supabase project and paste its URL + anon key into `.env.local`.
2. In the Supabase SQL editor, run `src/lib/db/schema.sql` (creates `profiles`, `scans`, RLS, auto-profile trigger).
3. Create a **private** Storage bucket named `scans` and apply the folder-based RLS policy noted at the bottom of `schema.sql`:
   ```sql
   create policy "scans_user_rw" on storage.objects
     for all using (bucket_id = 'scans' and auth.uid()::text = (storage.foldername(name))[1])
     with check (bucket_id = 'scans' and auth.uid()::text = (storage.foldername(name))[1]);
   ```
4. Enable **Email** provider in Supabase Auth (the app uses email+password). Apple/Google buttons are wired but show a "coming soon" toast — swap in real providers when ready.

## Scripts

- `npm run dev` — Next.js dev server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint`

## AI

`src/lib/ai/skinAnalyzer.ts` exports a `SkinAnalyzer` interface. `MockSkinAnalyzer` returns deterministic ABCDE + risk score based on an image hash (same file → same result). Replace `skinAnalyzer` with a real implementation (e.g. OpenAI Vision, on-device model) without touching `POST /api/scans`.

## PWA

- Manifest served from `/manifest.webmanifest` (`src/app/manifest.webmanifest/route.ts`)
- Icons: `public/icons/icon.svg` (single SVG used at any size)
- Service worker `public/sw.js` registered by `layout.tsx`; cache-first for `/_next/` and `/icons/`, network-first for navigations with `/welcome` as offline fallback.
- Installable from Chrome/Safari "Add to Home Screen" once served over HTTPS.

## Notes / out of scope

- Real Apple/Google OAuth — UI in place, providers not configured.
- Real ML model — pluggable interface ready for drop-in replacement.
- i18n — language switcher visual only (EN strings).
