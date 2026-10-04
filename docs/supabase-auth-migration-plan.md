# Supabase Auth Migration Plan

**Status:** Implemented (see checklist in `docs/supabase-auth-acceptance.md`).  
**Locked decisions:** (1) remap `user_local_dev` → first Auth UUID with dry-run + rollback; (2) defer mission list hydrate to follow-up **Phase D.1**; (3) convert `user_id` columns to `uuid` and RLS to `auth.uid()`.

**Goal:** Multi-user Supabase Auth for Parallax personal use now and public accounts later, preserving mission → Save Log → Sessions.

**Architecture:** Cookie-based Supabase Auth via `@supabase/ssr` (browser + server clients + Next.js 16 session refresh). App data ownership uses `auth.users.id` (UUID). No Clerk; no local-token bypass in release paths.

**Tech stack:** Next.js 16.1.6 App Router, `@supabase/ssr` + `@supabase/supabase-js`, email/password Auth, Postgres RLS with `auth.uid()`.

**Official guidance:** [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [Password-based Auth](https://supabase.com/docs/guides/auth/passwords). Prefer `createBrowserClient` / `createServerClient` from `@supabase/ssr`; session refresh via Next.js middleware/proxy calling `supabase.auth.getClaims()` (not deprecated auth-helpers).

---

## 1. Current state (repo truth)

| Area | Finding | Citations |
|------|---------|-----------|
| Runtime auth | Local JWT only; AuthProvider fetches `/api/auth/local-token`, sets `accessToken` getter, bootstraps location/gear | `src/components/AuthProvider.tsx`, `app/api/auth/local-token/route.ts`, `src/lib/supabase/mintLocalJwt.ts`, `src/lib/supabase/client.ts` |
| User id type | DB `user_id text`; default `auth.jwt()->>'sub'`; helper `public.clerk_user_id()`; never `auth.uid()` | `supabase/migrations/20261004003627_parallax_core_schema.sql` |
| App writes | Inserts omit `user_id`; Postgres default fills from JWT `sub` | `src/lib/supabase/queries/*` |
| Clerk | `@clerk/nextjs` installed; zero imports; env keys commented | `package.json`, `src/lib/supabase/env.ts`, `.env.example` |
| Local user | Default `user_local_dev` via `NEXT_PUBLIC_PARALLAX_LOCAL_USER_ID` | `src/lib/supabase/env.ts` |
| Fixtures | Clerk-shaped text ids `user_fixture_a` / `user_fixture_b` | `supabase/fixtures/rls_two_user_verify.sql` |
| Live data | App creates local rows under local JWT user | AuthProvider `ensureDefaultLocationAndGear` |
| Missions gap | Persist from Setup+; list still Zustand — no hydrate | `app/(app)/missions/page.tsx`, `src/lib/missionStore.ts` |
| Local Auth config | `enable_signup = true`, `enable_confirmations = false` | `supabase/config.toml` |
| Prior build order | A → C → D → B+E → Phase 5; Phase D assumed Clerk | `docs/parallax-plan.md` Phase 4 |

---

## 2. Target Supabase Auth flow

**Pages (minimal; reuse zinc/indigo tokens):**

- `/auth/sign-up` — `supabase.auth.signUp`
- `/auth/sign-in` — `supabase.auth.signInWithPassword`
- `/auth/forgot-password` — `resetPasswordForEmail`
- `/auth/reset-password` — `updateUser({ password })`
- `/auth/confirm` — PKCE / `token_hash` exchange
- Sign-out on user page (wire only)

**Clients:** `@supabase/ssr` browser + server clients; middleware/proxy refreshes session; AuthProvider uses session + `onAuthStateChange`; no session → `/auth/sign-in`.

**Stranding prevention:** local confirmations off; hosted enables confirmations + redirect URLs; clear errors on expired recovery; no local-token fallback.

**Returning user (this migration):** locations, gear, sessions from DB. Missions stay Zustand until Phase D.1.

---

## 3. Sign-up now vs open later

Same model always: `auth.users` + UUID `user_id`. Personal use creates 1–2 accounts; public launch leaves signup on. Optional hosted “Allow new users” toggle without schema change. No invite-only schema; no single-user RLS exception.

---

## 4. Schema + RLS strategy

Convert `user_id` text → uuid; RLS `auth.uid() = user_id`. Remap `user_local_dev` via `scripts/remap-local-user.sql` (dry-run + apply + rollback). Prefer dump restore for full rollback. Rewrite fixtures under Auth UUIDs.

---

## 5. Implementation tasks

1. This plan doc  
2. Deps + env (`@supabase/ssr`, remove Clerk)  
3. SSR clients + session refresh middleware  
4. Schema/RLS migration + remap script + Auth fixtures  
5. Auth pages + confirm/recovery  
6. AuthProvider + `/(app)` gate  
7. Zod `user_id` uuid; Save Log smoke  
8. Remove local-token / mint / Clerk  
9. Acceptance checklist  
10. **Phase D.1 (follow-up):** mission list hydrate from DB  

**Build order change vs `docs/parallax-plan.md`:** insert **Phase Auth** after B+E / before multi-user release. Clerk assumption in Phase D is superseded. Do not reopen A–E.

---

## 6. Removals before release

Local-token endpoint, `mintLocalJwt`, Clerk deps/env, `clerk_user_id()`, any mint-if-missing bypass — fail closed to sign-in.

---

## 7. Acceptance checks

- Two accounts: sign in / sign out  
- Returning user sees locations, gear, sessions after refresh (missions: Zustand until D.1)  
- Data survives refresh  
- A cannot read/modify B’s data  
- Missing/expired auth fails clearly  
- Save Log still works / idempotent  
- Local-token and Clerk gone  

---

## 8. Open facts

- Exact `user_local_dev` row counts: run remap dry-run before apply  
- Hosted SMTP/templates needed before enabling confirmations in production  
- Electron packaging out of scope  
- At implementation time, use the session-refresh file name required by the installed Next.js + Supabase SSR docs (`middleware.ts` and/or `proxy.ts`)  

---

## Smallest safe first implementation task

Install `@supabase/ssr` and add browser/server clients + session refresh with no schema change yet.

## Decisions locked

- Remap `user_local_dev` → Auth UUID  
- Defer mission hydrate to Phase D.1  
- `user_id` → `uuid` + `auth.uid()`  
- Email/password only (no OAuth)  
